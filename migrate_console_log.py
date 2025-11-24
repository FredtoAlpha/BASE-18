#!/usr/bin/env python3
"""
===================================================================
MIGRATION AUTOMATIQUE : console.log → LoggerClient
===================================================================

Remplace intelligemment les console.log par LoggerClient selon:
- Emoji patterns (📡🔍→debug, ✅→info, ❌→error)
- Contexte (error/success/debug)
- Supprime les console.log commentés

Usage:
    python3 migrate_console_log.py [--dry-run] [--file FILE]
"""

import re
import sys
import argparse
from pathlib import Path
from typing import List, Tuple, Dict

# ===================================================================
# CONFIGURATION
# ===================================================================

# Patterns d'emoji pour classification
EMOJI_PATTERNS = {
    'debug': ['📡', '🔍', '🖱️', '🔧', '🔄', '🎲', '🧪', '⚙️', 'DEBUG', 'TRACE'],
    'info': ['✅', '📊', '🎯', '💡', '📝', '🎉', '✨', 'INFO', 'SUCCESS'],
    'warn': ['⚠️', '🟡', '⏰', 'WARN', 'WARNING', 'SLOW'],
    'error': ['❌', '🔥', '💥', '🚫', '⛔', 'ERROR', 'FAIL', 'FATAL']
}

# Patterns à supprimer (commentés ou debug inutile)
REMOVE_PATTERNS = [
    r'^\s*//\s*console\.log',           # Commentés
    r'console\.log\(["\']GEMINI_DEBUG',  # Debug spécifique
    r'console\.log\(["\']DEBUG_',        # Debug préfixé
]

# Patterns à conserver (déjà bien structurés)
KEEP_PATTERNS = [
    r'console\.error\(',
    r'console\.warn\(',
    r'console\.info\(',
    r'console\.debug\(',
]

# ===================================================================
# FUNCTIONS
# ===================================================================

def classify_log_level(line: str) -> str:
    """
    Classifie une ligne console.log selon son contenu
    Retourne: 'debug', 'info', 'warn', 'error', 'remove', 'keep'
    """
    # Vérifier si déjà structuré (à garder)
    for pattern in KEEP_PATTERNS:
        if re.search(pattern, line):
            return 'keep'

    # Vérifier si à supprimer
    for pattern in REMOVE_PATTERNS:
        if re.search(pattern, line):
            return 'remove'

    # Classifier selon les emojis/mots-clés
    line_lower = line.lower()

    # Compter les occurrences par catégorie
    scores = {'debug': 0, 'info': 0, 'warn': 0, 'error': 0}

    for level, patterns in EMOJI_PATTERNS.items():
        for pattern in patterns:
            if pattern in line or pattern.lower() in line_lower:
                scores[level] += 1

    # Retourner le niveau avec le score le plus élevé
    if max(scores.values()) > 0:
        return max(scores, key=scores.get)

    # Par défaut: debug (console.log simple sans contexte)
    return 'debug'


def extract_log_content(line: str) -> Tuple[str, str, str]:
    """
    Extrait le contenu d'un console.log
    Retourne: (indentation, content, trailing)
    """
    # Extraire l'indentation
    match = re.match(r'^(\s*)', line)
    indent = match.group(1) if match else ''

    # Extraire le contenu entre console.log( et )
    # Gérer les cas simples et complexes
    content_match = re.search(r'console\.log\((.*)\);?\s*$', line)
    if content_match:
        content = content_match.group(1)
        trailing = ';' if line.rstrip().endswith(';') else ''
        return indent, content, trailing

    # Cas complexe (multiligne ou imbriqué)
    return indent, line.strip(), ''


def migrate_line(line: str, level: str) -> str:
    """
    Migre une ligne console.log vers LoggerClient
    """
    if level == 'keep':
        return line

    if level == 'remove':
        return ''  # Supprimer la ligne

    indent, content, trailing = extract_log_content(line)

    # Cas spécial: console.log simple sans arguments
    if not content or content.strip() == '':
        return ''

    # Construire la nouvelle ligne
    new_line = f"{indent}LoggerClient.{level}({content}){trailing}\n"

    return new_line


def migrate_file(filepath: Path, dry_run: bool = False) -> Dict[str, int]:
    """
    Migre un fichier HTML/JS
    Retourne: stats {total, migrated, removed, kept}
    """
    stats = {
        'total': 0,
        'debug': 0,
        'info': 0,
        'warn': 0,
        'error': 0,
        'removed': 0,
        'kept': 0
    }

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"❌ Error reading {filepath}: {e}")
        return stats

    new_lines = []
    modified = False

    for line in lines:
        # Ignorer si pas de console.log
        if 'console.log' not in line:
            new_lines.append(line)
            continue

        stats['total'] += 1
        level = classify_log_level(line)

        if level == 'keep':
            stats['kept'] += 1
            new_lines.append(line)
        elif level == 'remove':
            stats['removed'] += 1
            modified = True
            # Ne pas ajouter la ligne (suppression)
        else:
            stats[level] += 1
            new_line = migrate_line(line, level)
            if new_line:
                new_lines.append(new_line)
                modified = True
            else:
                # Ligne vide après migration (erreur)
                new_lines.append(line)

    # Écrire le fichier si modifié et pas en dry-run
    if modified and not dry_run:
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print(f"✅ Migrated: {filepath.name}")
        except Exception as e:
            print(f"❌ Error writing {filepath}: {e}")
            return stats
    elif modified and dry_run:
        print(f"🔍 [DRY-RUN] Would migrate: {filepath.name}")

    return stats


def print_stats(filepath: Path, stats: Dict[str, int]):
    """
    Affiche les statistiques de migration
    """
    if stats['total'] == 0:
        return

    print(f"\n📊 {filepath.name}:")
    print(f"  Total console.log: {stats['total']}")
    print(f"  → LoggerClient.debug(): {stats['debug']}")
    print(f"  → LoggerClient.info(): {stats['info']}")
    print(f"  → LoggerClient.warn(): {stats['warn']}")
    print(f"  → LoggerClient.error(): {stats['error']}")
    print(f"  ✅ Kept (console.error/warn): {stats['kept']}")
    print(f"  🗑️  Removed (commented/debug): {stats['removed']}")

    migrated = stats['debug'] + stats['info'] + stats['warn'] + stats['error']
    remaining = stats['total'] - stats['removed']
    print(f"  📉 Reduction: {stats['total']} → {remaining} ({-stats['removed']:+d})")


def main():
    parser = argparse.ArgumentParser(description='Migrate console.log to LoggerClient')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without modifying files')
    parser.add_argument('--file', type=str, help='Migrate a single file')
    parser.add_argument('--all', action='store_true', help='Migrate all HTML files')

    args = parser.parse_args()

    print("=" * 60)
    print("🚀 MIGRATION: console.log → LoggerClient")
    print("=" * 60)

    if args.dry_run:
        print("🔍 DRY-RUN MODE (no files will be modified)\n")

    # Déterminer les fichiers à migrer
    if args.file:
        files = [Path(args.file)]
    elif args.all:
        files = list(Path('.').glob('*.html'))
        files.sort(key=lambda f: f.stat().st_size, reverse=True)  # Plus gros d'abord
    else:
        # Par défaut: les 3 plus gros fichiers
        html_files = list(Path('.').glob('*.html'))

        # Compter console.log par fichier
        file_counts = []
        for f in html_files:
            try:
                with open(f, 'r', encoding='utf-8') as fp:
                    count = fp.read().count('console.log')
                    if count > 0:
                        file_counts.append((f, count))
            except:
                pass

        file_counts.sort(key=lambda x: x[1], reverse=True)
        files = [f for f, _ in file_counts[:3]]

        print(f"📁 Migrating top 3 files by console.log count:\n")
        for f, count in file_counts[:3]:
            print(f"  - {f.name}: {count} console.log")
        print()

    # Migrer chaque fichier
    total_stats = {
        'total': 0,
        'debug': 0,
        'info': 0,
        'warn': 0,
        'error': 0,
        'removed': 0,
        'kept': 0
    }

    for filepath in files:
        if not filepath.exists():
            print(f"❌ File not found: {filepath}")
            continue

        stats = migrate_file(filepath, dry_run=args.dry_run)
        print_stats(filepath, stats)

        # Cumuler les stats
        for key in total_stats:
            total_stats[key] += stats[key]

    # Stats globales
    print("\n" + "=" * 60)
    print("📊 TOTAL MIGRATION STATS")
    print("=" * 60)
    print(f"  Total console.log processed: {total_stats['total']}")
    print(f"  → LoggerClient.debug(): {total_stats['debug']}")
    print(f"  → LoggerClient.info(): {total_stats['info']}")
    print(f"  → LoggerClient.warn(): {total_stats['warn']}")
    print(f"  → LoggerClient.error(): {total_stats['error']}")
    print(f"  ✅ Kept: {total_stats['kept']}")
    print(f"  🗑️  Removed: {total_stats['removed']}")

    migrated = total_stats['debug'] + total_stats['info'] + total_stats['warn'] + total_stats['error']
    remaining = total_stats['total'] - total_stats['removed']
    reduction_pct = (total_stats['removed'] / total_stats['total'] * 100) if total_stats['total'] > 0 else 0

    print(f"\n  📉 Reduction: {total_stats['total']} → {remaining} ({-total_stats['removed']:+d}, -{reduction_pct:.1f}%)")
    print("=" * 60)

    if args.dry_run:
        print("\n🔍 DRY-RUN completed. No files were modified.")
        print("   Run without --dry-run to apply changes.")


if __name__ == '__main__':
    main()
