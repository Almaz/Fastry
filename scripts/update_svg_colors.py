import sys

with open('/home/almaz/StatSites/Astro/fastry/src/components/blog/BlogImageSVG.astro', 'r') as f:
    content = f.read()

# Light mode
content = content.replace(
    '  .svg-host :global(.bg)  { fill: var(--brand-600); }',
    '  .svg-host :global(.bg)  { fill: var(--brand-100); }', 1
)
content = content.replace(
    '  .svg-host :global(.ico) { stroke: var(--brand-50); }',
    '  .svg-host :global(.ico) { stroke: var(--brand-600); }', 1
)
content = content.replace(
    '  .svg-host :global(.txt) { fill: var(--brand-50); }',
    '  .svg-host :global(.txt) { fill: var(--brand-600); }', 1
)
content = content.replace(
    '  .svg-host :global(.ptx) { fill: var(--brand-50); }',
    '  .svg-host :global(.ptx) { fill: var(--brand-600); }', 1
)

# Dark mode
content = content.replace(
    '  :global(html.dark) .svg-host :global(.bg)  { fill: var(--brand-600); }',
    '  :global(html.dark) .svg-host :global(.bg)  { fill: var(--brand-950); }', 1
)
content = content.replace(
    '  :global(html.dark) .svg-host :global(.txt) { fill: var(--brand-50); }',
    '  :global(html.dark) .svg-host :global(.txt) { fill: var(--brand-200); }', 1
)
content = content.replace(
    '  :global(html.dark) .svg-host :global(.ptx) { fill: var(--brand-100); }',
    '  :global(html.dark) .svg-host :global(.ptx) { fill: var(--brand-200); }', 1
)

with open('/home/almaz/StatSites/Astro/fastry/src/components/blog/BlogImageSVG.astro', 'w') as f:
    f.write(content)
print('Done')
