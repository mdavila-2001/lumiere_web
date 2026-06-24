import * as React from 'react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import { DataTable, type ColumnDef } from './components/ui/data-table';
import { Select } from './components/ui/select';
import { FileInput } from './components/ui/file-input';
import { Checkbox, Radio } from './components/ui/choice-input';
import { Sidebar } from './components/layout/sidebar';

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
    const [textVal, setTextVal] = React.useState('');
    const [numberVal, setNumberVal] = React.useState(120);
    const [dateVal, setDateVal] = React.useState('');
    const [timeVal, setTimeVal] = React.useState('20:30');
    const [selectVal, setSelectVal] = React.useState('imax');
    const [posterPreview, setPosterPreview] = React.useState<string>('');
    const [termsAccepted, setTermsAccepted] = React.useState(false);
    const [paymentMethod, setPaymentMethod] = React.useState('card');
    
    // Error state simulation
    const [formErrors, setFormErrors] = React.useState({
        text: '',
        time: '',
        select: '',
        file: '',
        choice: '',
    });

    const handleSimulateLoad = () => {
        setLoading(true);
        setTimeout(() => setLoading(false), 2000);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPosterPreview(URL.createObjectURL(file));
            setFormErrors(prev => ({ ...prev, file: '' }));
        }
    };

    const triggerFormValidation = () => {
        setFormErrors({
            text: !textVal ? 'Movie title is required' : '',
            time: !timeVal ? 'Time is required' : '',
            select: selectVal === 'none' ? 'Please select a room type' : '',
            file: !posterPreview ? 'Movie poster image is required' : '',
            choice: !termsAccepted ? 'You must accept the terms' : '',
        });
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

    const selectOptions = [
        { value: 'none', label: '-- Select Room Type --' },
        { value: 'standard', label: 'Standard Room' },
        { value: 'imax', label: 'IMAX 3D Theater' },
        { value: 'vip', label: 'VIP Lounge' },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex w-full">
            <Sidebar onNewScreeningClick={() => console.log('New Screening clicked')} />
            <main className="flex-grow pl-64 w-full">
                <div className="max-w-4xl mx-auto py-12 px-6 space-y-12 text-left">
                {/* Header */}
                <header className="border-b border-zinc-800 pb-6 text-left">
                    <Badge variant="amber" className="mb-2">Lumière System v1.1</Badge>
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
                        <Button variant="outline">Outline Button</Button>
                        
                        {/* Icon Buttons */}
                        <Button 
                            variant="primary" 
                            icon={
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            }
                        >
                            Book Ticket (Left Icon)
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            iconPosition="right"
                            icon={
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            }
                        >
                            Next Step (Right Icon)
                        </Button>
                        
                        <Button variant="primary" isLoading={loading} onClick={handleSimulateLoad}>
                            {loading ? 'Processing...' : 'Click to Load (2s)'}
                        </Button>
                        
                        <Button 
                            variant="outline" 
                            isLoading={loading} 
                            onClick={handleSimulateLoad}
                            icon={
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                            }
                        >
                            Load with Icon
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

                {/* Section: Inputs, Selects and Choice Controls */}
                <section className="space-y-6 text-left">
                    <h2 className="text-xl font-bold border-b border-zinc-800 pb-2">Form Controls</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Text Input */}
                        <Input
                            label="Movie Title"
                            placeholder="Enter movie title..."
                            value={textVal}
                            onChange={(e) => setTextVal(e.target.value)}
                            error={formErrors.text}
                        />

                        {/* Number Input */}
                        <Input
                            type="number"
                            label="Duration (minutes)"
                            placeholder="120"
                            value={numberVal}
                            onChange={(e) => setNumberVal(Number(e.target.value))}
                        />

                        {/* Date Input */}
                        <Input
                            type="date"
                            label="Release Date"
                            value={dateVal}
                            onChange={(e) => setDateVal(e.target.value)}
                        />

                        {/* Time Input */}
                        <Input
                            type="time"
                            label="Showtime Time"
                            value={timeVal}
                            onChange={(e) => setTimeVal(e.target.value)}
                            error={formErrors.time}
                        />

                        {/* Select Component */}
                        <Select
                            label="Room Type Selection"
                            options={selectOptions}
                            value={selectVal}
                            onChange={(e) => setSelectVal(e.target.value)}
                            error={formErrors.select}
                        />

                        {/* File Uploader (FileInput) */}
                        <FileInput
                            label="Movie Poster Uploader"
                            previewUrl={posterPreview}
                            onChange={handleFileChange}
                            error={formErrors.file}
                        />
                    </div>

                    {/* Checkbox and Radio Options */}
                    <div className="border border-zinc-800 rounded-lg p-6 bg-zinc-900/30 space-y-6">
                        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Choice Control Testing</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Checkboxes */}
                            <div className="space-y-3">
                                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Checkboxes</span>
                                <Checkbox
                                    label="I accept all terms of service & Lumière policies"
                                    checked={termsAccepted}
                                    onChange={(e) => {
                                        setTermsAccepted(e.target.checked);
                                        setFormErrors(prev => ({ ...prev, choice: '' }));
                                    }}
                                    error={formErrors.choice}
                                />
                                <Checkbox
                                    label="Receive weekly newsletter via email"
                                    defaultChecked
                                />
                            </div>

                            {/* Radio Buttons */}
                            <div className="space-y-3">
                                <span className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider">Payment Method</span>
                                <div className="space-y-2">
                                    <Radio
                                        name="payment"
                                        label="Credit / Debit Card"
                                        checked={paymentMethod === 'card'}
                                        onChange={() => setPaymentMethod('card')}
                                    />
                                    <Radio
                                        name="payment"
                                        label="Paypal Account"
                                        checked={paymentMethod === 'paypal'}
                                        onChange={() => setPaymentMethod('paypal')}
                                    />
                                    <Radio
                                        name="payment"
                                        label="Cash at Ticket Counter"
                                        checked={paymentMethod === 'cash'}
                                        onChange={() => setPaymentMethod('cash')}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="primary" onClick={triggerFormValidation}>
                            Simulate Form Validation
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => {
                                setTextVal('');
                                setDateVal('');
                                setPosterPreview('');
                                setTermsAccepted(false);
                                setFormErrors({ text: '', time: '', select: '', file: '', choice: '' });
                            }}
                        >
                            Reset Fields & Errors
                        </Button>
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
            </main>
        </div>
    );
}
