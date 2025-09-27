// const { createGlobPatternsForDependencies } = require('@nx/next/tailwind');

// The above utility import will not work if you are using Next.js' --turbo.
// Instead you will have to manually add the dependent paths to be included.
// For example
// ../libs/buttons/**/*.{ts,tsx,js,jsx,html}',                 <--- Adding a shared lib
// !../libs/buttons/**/*.{stories,spec}.{ts,tsx,js,jsx,html}', <--- Skip adding spec/stories files from shared lib

// If you are **not** using `--turbo` you can uncomment both lines 1 & 19.
// A discussion of the issue can be found: https://github.com/nrwl/nx/issues/26510

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './{src,pages,components,app}/**/*.{ts,tsx,js,jsx,html}',
        '!./{src,pages,components,app}/**/*.{stories,spec}.{ts,tsx,js,jsx,html}',
        //     ...createGlobPatternsForDependencies(__dirname)
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--color-background)',
                foreground: 'var(--color-foreground)',
                card: 'var(--color-card)',
                'card-foreground': 'var(--color-card-foreground)',
                popover: 'var(--color-popover)',
                'popover-foreground': 'var(--color-popover-foreground)',
                primary: 'var(--color-primary)',
                'primary-foreground': 'var(--color-primary-foreground)',
                secondary: 'var(--color-secondary)',
                'secondary-foreground': 'var(--color-secondary-foreground)',
                muted: 'var(--color-muted)',
                'muted-foreground': 'var(--color-muted-foreground)',
                accent: 'var(--color-accent)',
                'accent-foreground': 'var(--color-accent-foreground)',
                destructive: 'var(--color-destructive)',
                'destructive-foreground': 'var(--color-destructive-foreground)',
                border: 'var(--color-border)',
                input: 'var(--color-input)',
                ring: 'var(--color-ring)',
                'chart-1': 'var(--color-chart-1)',
                'chart-2': 'var(--color-chart-2)',
                'chart-3': 'var(--color-chart-3)',
                'chart-4': 'var(--color-chart-4)',
                'chart-5': 'var(--color-chart-5)',
                sidebar: 'var(--color-sidebar)',
                'sidebar-foreground': 'var(--color-sidebar-foreground)',
                'sidebar-primary': 'var(--color-sidebar-primary)',
                'sidebar-primary-foreground': 'var(--color-sidebar-primary-foreground)',
                'sidebar-accent': 'var(--color-sidebar-accent)',
                'sidebar-accent-foreground': 'var(--color-sidebar-accent-foreground)',
                'sidebar-border': 'var(--color-sidebar-border)',
                'sidebar-ring': 'var(--color-sidebar-ring)',
            },
            borderRadius: {
                lg: 'var(--radius-lg)',
                md: 'var(--radius-md)',
                sm: 'var(--radius-sm)',
                xl: 'var(--radius-xl)',
            },
        },
    },
    plugins: [],
};
