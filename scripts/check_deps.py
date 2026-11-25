#!/usr/bin/env python3
"""Check actual usage of each dependency in package.json against the codebase."""
import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path('/home/z/my-project')
SRC = ROOT / 'src'

# Load package.json
with open(ROOT / 'package.json') as f:
    pkg = json.load(f)

deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}

# Patterns to find for each dep
# Map dep -> list of import/require patterns to grep for
# We'll check both the package name and common subpath imports
dep_checks = {
    # Auth
    '@auth/prisma-adapter': ['@auth/prisma-adapter'],
    'next-auth': ['next-auth', 'NextAuth', 'auth.ts'],
    # AWS
    '@aws-sdk/client-s3': ['@aws-sdk/client-s3'],
    '@aws-sdk/s3-request-presigner': ['@aws-sdk/s3-request-presigner'],
    # dnd
    '@dnd-kit/core': ['@dnd-kit/core'],
    '@dnd-kit/sortable': ['@dnd-kit/sortable'],
    '@dnd-kit/utilities': ['@dnd-kit/utilities'],
    # forms
    '@hookform/resolvers': ['@hookform/resolvers'],
    'react-hook-form': ['react-hook-form', 'useForm'],
    'zod': ['from "zod"', "from 'zod'", 'z.object', 'z.string', 'z.number'],
    # mdx editor
    '@mdxeditor/editor': ['@mdxeditor/editor'],
    # readability
    '@mozilla/readability': ['@mozilla/readability', 'Readability'],
    'linkedom': ['linkedom'],
    'jsdom': ['jsdom'],
    # prisma
    '@prisma/client': ['@prisma/client', 'from "@/lib/db"'],
    'prisma': ['prisma'],  # dev tool
    # radix
    '@radix-ui/react-accordion': ['@radix-ui/react-accordion', 'components/ui/accordion'],
    '@radix-ui/react-alert-dialog': ['@radix-ui/react-alert-dialog', 'components/ui/alert-dialog'],
    '@radix-ui/react-aspect-ratio': ['@radix-ui/react-aspect-ratio', 'components/ui/aspect-ratio'],
    '@radix-ui/react-avatar': ['@radix-ui/react-avatar', 'components/ui/avatar'],
    '@radix-ui/react-checkbox': ['@radix-ui/react-checkbox', 'components/ui/checkbox'],
    '@radix-ui/react-collapsible': ['@radix-ui/react-collapsible', 'components/ui/collapsible'],
    '@radix-ui/react-context-menu': ['@radix-ui/react-context-menu', 'components/ui/context-menu'],
    '@radix-ui/react-dialog': ['@radix-ui/react-dialog', 'components/ui/dialog'],
    '@radix-ui/react-dropdown-menu': ['@radix-ui/react-dropdown-menu', 'components/ui/dropdown-menu'],
    '@radix-ui/react-hover-card': ['@radix-ui/react-hover-card', 'components/ui/hover-card'],
    '@radix-ui/react-label': ['@radix-ui/react-label', 'components/ui/label'],
    '@radix-ui/react-menubar': ['@radix-ui/react-menubar', 'components/ui/menubar'],
    '@radix-ui/react-navigation-menu': ['@radix-ui/react-navigation-menu', 'components/ui/navigation-menu'],
    '@radix-ui/react-popover': ['@radix-ui/react-popover', 'components/ui/popover'],
    '@radix-ui/react-progress': ['@radix-ui/react-progress', 'components/ui/progress'],
    '@radix-ui/react-radio-group': ['@radix-ui/react-radio-group', 'components/ui/radio-group'],
    '@radix-ui/react-scroll-area': ['@radix-ui/react-scroll-area', 'components/ui/scroll-area'],
    '@radix-ui/react-select': ['@radix-ui/react-select', 'components/ui/select'],
    '@radix-ui/react-separator': ['@radix-ui/react-separator', 'components/ui/separator'],
    '@radix-ui/react-slider': ['@radix-ui/react-slider', 'components/ui/slider'],
    '@radix-ui/react-slot': ['@radix-ui/react-slot', 'components/ui/slot', '@asChild'],
    '@radix-ui/react-switch': ['@radix-ui/react-switch', 'components/ui/switch'],
    '@radix-ui/react-tabs': ['@radix-ui/react-tabs', 'components/ui/tabs'],
    '@radix-ui/react-toast': ['@radix-ui/react-toast', 'components/ui/toast'],
    '@radix-ui/react-toggle': ['@radix-ui/react-toggle', 'components/ui/toggle'],
    '@radix-ui/react-toggle-group': ['@radix-ui/react-toggle-group', 'components/ui/toggle-group'],
    '@radix-ui/react-tooltip': ['@radix-ui/react-tooltip', 'components/ui/tooltip'],
    # reactuses
    '@reactuses/core': ['@reactuses/core'],
    # tanstack
    '@tanstack/react-query': ['@tanstack/react-query', 'useQuery', 'useMutation', 'QueryClient'],
    '@tanstack/react-table': ['@tanstack/react-table'],
    # bcrypt
    'bcryptjs': ['bcryptjs', 'bcrypt'],
    # cva / clsx / tailwind-merge
    'class-variance-authority': ['class-variance-authority', 'cva('],
    'clsx': ['clsx'],
    'tailwind-merge': ['tailwind-merge', 'twMerge'],
    # cmdk
    'cmdk': ['cmdk', 'components/ui/command'],
    # date
    'date-fns': ['date-fns', 'jalali', 'jalaliDate'],
    # embla
    'embla-carousel-react': ['embla-carousel-react', 'useEmbla'],
    # input-otp
    'input-otp': ['input-otp', 'InputOTP'],
    # fast-xml-parser
    'fast-xml-parser': ['fast-xml-parser'],
    # framer-motion
    'framer-motion': ['framer-motion'],
    # lucide
    'lucide-react': ['lucide-react'],
    # next
    'next': ['next/', 'from "next"', "from 'next'"],
    'next-intl': ['next-intl'],
    'next-themes': ['next-themes'],
    # react
    'react': ["from 'react'", 'from "react"'],
    'react-dom': ['react-dom', 'createRoot'],
    'react-day-picker': ['react-day-picker', 'DayPicker'],
    'react-markdown': ['react-markdown'],
    'react-resizable-panels': ['react-resizable-panels', 'ResizablePanel'],
    'react-syntax-highlighter': ['react-syntax-highlighter', 'SyntaxHighlighter', 'Prism'],
    # recharts
    'recharts': ['recharts'],
    # sharp
    'sharp': ['sharp', 'require("sharp")'],
    # sonner
    'sonner': ['sonner', 'Toaster', 'toast('],
    # tailwindcss-animate / tw-animate
    'tailwindcss-animate': ['tailwindcss-animate'],
    'tw-animate-css': ['tw-animate-css'],
    # uuid
    'uuid': ['uuid', 'v4()', 'uuidv4'],
    # vaul
    'vaul': ['vaul', 'Drawer'],
    # z-ai
    'z-ai-web-dev-sdk': ['z-ai-web-dev-sdk'],
    # zustand
    'zustand': ['zustand'],
    # build tools
    'tailwindcss': ['tailwindcss'],
    'typescript': ['typescript', 'tsconfig'],
    'eslint': ['eslint'],
    'eslint-config-next': ['eslint-config-next'],
    '@tailwindcss/postcss': ['@tailwindcss/postcss'],
    '@types/react': ['@types/react'],
    '@types/react-dom': ['@types/react-dom'],
    'bun-types': ['bun-types'],
    # react 19 types
    'react-day-picker': ['react-day-picker', 'day-picker'],
    # cmdk
    'cmdk': ['cmdk'],
}

# Search all source files
print("=" * 80)
print("DEPENDENCY USAGE REPORT")
print("=" * 80)
print(f"{'STATUS':<8} {'DEP':<40} {'FILES':<8} {'EXAMPLE'}")
print("-" * 80)

results = []

for dep, patterns in dep_checks.items():
    found_files = set()
    example = ''
    for pattern in patterns:
        try:
            cmd = ['grep', '-r', '-l', '-E', '--include=*.ts', '--include=*.tsx',
                   '--include=*.js', '--include=*.jsx', '--include=*.mjs',
                   '--include=*.json', '--include=*.css',
                   '--include=*.md', '--include=*.prisma',
                   '-I', pattern, str(SRC)]
            out = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            for line in out.stdout.strip().split('\n'):
                if line:
                    rel = line.replace(str(SRC) + '/', '')
                    # Skip self-references in package.json
                    if rel.endswith('package.json') and pattern == dep:
                        continue
                    found_files.add(rel)
                    if not example:
                        # Find the matching line
                        line_cmd = ['grep', '-n', '-E', pattern, line]
                        lr = subprocess.run(line_cmd, capture_output=True, text=True, timeout=10)
                        if lr.stdout:
                            ex_line = lr.stdout.strip().split('\n')[0]
                            example = ex_line[:80]
        except Exception as e:
            pass
    results.append((dep, len(found_files), found_files, example))

# Sort: unused first
results.sort(key=lambda x: (x[1] == 0, -x[1], x[0]))

for dep, count, files, example in results:
    status = "USED" if count > 0 else "UNUSED"
    marker = "  ✅" if count > 0 else "  ❌"
    print(f"{marker} {dep:<40} {count:<8} {example}")
    if count > 0 and count <= 3:
        for f in sorted(files)[:3]:
            print(f"      └─ {f}")

print()
print("=" * 80)
print("SUMMARY")
print("=" * 80)
used = [r for r in results if r[1] > 0]
unused = [r for r in results if r[1] == 0]
print(f"Used:   {len(used)}")
print(f"Unused: {len(unused)}")
print()
if unused:
    print("Potentially removable:")
    for dep, _, _, _ in unused:
        print(f"  - {dep}")
