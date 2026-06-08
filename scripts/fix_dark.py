with open('/home/almaz/StatSites/Astro/fastry/src/components/blog/BlogImageSVG.astro', 'r') as f:
    content = f.read()

# Fix dark mode .bg
content = content.replace(
    ':global(html.dark) .svg-host :global(.bg)  { fill: var(--brand-100); }',
    ':global(html.dark) .svg-host :global(.bg)  { fill: var(--brand-950); }',
    1
)

# Fix dark mode .txt
content = content.replace(
    ':global(html.dark) .svg-host :global(.txt) { fill: var(--brand-600); }',
    ':global(html.dark) .svg-host :global(.txt) { fill: var(--brand-200); }',
    1
)

with open('/home/almaz/StatSites/Astro/fastry/src/components/blog/BlogImageSVG.astro', 'w') as f:
    f.write(content)
print('Fixed')
