import * as React from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { DataTable, type ColumnDef } from './components/ui/data-table';

interface MovieItem {
    id: string;
    title: string;
    genre: string;
    rating: string;
    duration: number;
    releaseYear: number;
}

export default function TestComponents() {
    const [loading, setLoading] = React.useState(false);
    const [inputValue, setInputValue] = React.useState('');
    const [errorValue, setErrorValue] = React.useState('');

    const handleSimulateLoad = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    const sampleMovies: MovieItem[] = [
        { id: 'm-101', title: 'Stellar Horizon', genre: 'Sci-Fi', rating: 'IMAX', duration: 165, releaseYear: 2026 },
        { id: 'm-102', title: 'The Budapest Grand', genre: 'Drama', rating: 'R', duration: 100, releaseYear: 2014 },
        { id: 'm-103', title: 'Pulp Fiction', genre: 'Crime', rating: 'R', duration: 154, releaseYear: 1994 },
        { id: 'm-104', title: 'Inception', genre: 'Action / Sci-Fi', rating: 'PG-13', duration: 148, releaseYear: 2010 },
    ];

    const columns: ColumnDef<MovieItem>[] = [
        { header: 'Code ID', accessorKey: 'id' },
        { header: 'Title', accessorKey: 'title' },
        { header: 'Genre', accessorKey: 'genre' },
        {
            header: 'Classification',
            render: (row) => (
                <Badge variant={row.rating === 'IMAX' ? 'amber' : 'zinc'}>
                    {row.rating}
                </Badge>
            ),
        },
        {
            header: 'Duration',
            render: (row) => <span className="font-mono text-zinc-400">{row.duration} min</span>,
        },
        {
            header: 'Year',
            accessorKey: 'releaseYear',
        },
    ];

    return (
        <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 py-12 px-6">
            <div className="max-w-4xl mx-auto space-y-12">
                {/* Header */}
                <header className="border-b border-zinc-800 pb-6 text-left">
                    <Badge variant="amber" className="mb-2">Lumière System v1.0</Badge>
                    <h1 className="text-4xl font-extrabold text-zinc-100 mt-1 mb-2 tracking-tight">
                        Design Tokens & UI components
                    </h1>
                    <p className="text-zinc-400 max-w-xl">
                        Preview playground for the brand's visual identity, atomic components, and dark cinematic theme parameters.
                    </p>
                </header>

                {/* Section: Buttons */}
                <section className="space-y-4 text-left">
                    <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Buttons</h2>
                    <div className="flex flex-wrap gap-4 items-center">
                        <Button variant="primary">Primary Button</Button>
                        <Button variant="secondary">Secondary Button</Button>
                        <Button variant="danger">Danger Button</Button>
                        <Button variant="primary" isLoading={loading} onClick={handleSimulateLoad}>
                            {loading ? 'Processing...' : 'Click to Load (2s)'}
                        </Button>
                        <Button variant="primary" disabled>
                            Disabled Button
                        </Button>
                    </div>
                </section>

                {/* Section: Badges */}
                <section className="space-y-4 text-left">
                    <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Badges</h2>
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="zinc">Info badge</Badge>
                        <Badge variant="zinc">PG-13</Badge>
                        <Badge variant="amber">Premiere</Badge>
                        <Badge variant="amber">IMAX 3D</Badge>
                    </div>
                </section>

                {/* Section: Inputs */}
                <section className="space-y-4 text-left">
                    <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Inputs</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Movie Title"
                            placeholder="Enter title..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                        />
                        <Input
                            label="Cinema Code (Simulated Error)"
                            placeholder="e.g. C-102"
                            error={errorValue}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) {
                                    setErrorValue('This field is mandatory');
                                } else if (val.length < 3) {
                                    setErrorValue('Code must contain at least 3 characters');
                                } else {
                                    setErrorValue('');
                                }
                            }}
                        />
                    </div>
                </section>

                {/* Section: Data Table */}
                <section className="space-y-4 text-left">
                    <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Data Table</h2>
                    <DataTable
                        columns={columns}
                        data={sampleMovies}
                        emptyMessage="No movie entries to show."
                    />
                </section>
            </div>
        </div>
    );
}
