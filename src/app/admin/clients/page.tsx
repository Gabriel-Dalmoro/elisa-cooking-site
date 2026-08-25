'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { 
    Users, 
    Plus, 
    Search, 
    Phone, 
    Mail, 
    MapPin, 
    AlertCircle, 
    Check, 
    Copy, 
    Edit2, 
    Trash2, 
    MessageCircle, 
    ChefHat, 
    Sparkles, 
    ShieldAlert,
    Filter,
    Upload,
    Download,
    FileSpreadsheet,
    AlertTriangle,
    LayoutGrid,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { ClientProfile } from '@/lib/types/cooking-ops';

const COMMON_ALLERGIES = [
    'Sans Gluten (Cœliaque)',
    'Sans Gluten',
    'Sans Lactose',
    'Sans Arachides',
    'Sans Fruits à coque',
    'Sans Porc',
    'Sans Crustacés',
    'Sans Œufs',
    'Végétarien',
    'Végan'
];

interface ParsedCsvClient {
    name: string;
    phone: string;
    email: string;
    address: string;
    defaultDishCount: number;
    personCount: number;
    allergies: string[];
    dislikes: string;
    notes: string;
}

export default function ClientDirectoryPage() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [allergyFilter, setAllergyFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    // Modal state for single client create/edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formQuota, setFormQuota] = useState(4);
    const [formPersonCount, setFormPersonCount] = useState(2);
    const [formAllergies, setFormAllergies] = useState<string[]>([]);
    const [formDislikes, setFormDislikes] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // CSV Import State
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [parsedCsvClients, setParsedCsvClients] = useState<ParsedCsvClient[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadClients = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/cooking-ops/admin');
            if (!res.ok) throw new Error('Erreur');
            const data = await res.json();
            setClients(data.clients || []);
        } catch (e) {
            console.error('Error loading clients:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadClients();
    }, []);

    const copyClientLink = (token: string) => {
        const url = `${window.location.origin}/choisir/${token}`;
        navigator.clipboard.writeText(url);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2500);
    };

    const getWhatsAppUrl = (client: ClientProfile) => {
        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/choisir/${client.token}`;
        const message = `Bonjour ${client.name.split(' ')[0]} ! ✨ Voici le menu de la semaine pour choisir vos ${client.defaultDishCount} plats : ${url}`;
        const cleanPhone = client.phone.replace(/[^0-9]/g, '');
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    };

    const openCreateModal = () => {
        setEditingClient(null);
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setFormAddress('');
        setFormQuota(4);
        setFormPersonCount(2);
        setFormAllergies([]);
        setFormDislikes('');
        setFormNotes('');
        setIsModalOpen(true);
    };

    const openEditModal = (client: ClientProfile) => {
        setEditingClient(client);
        setFormName(client.name);
        setFormPhone(client.phone || '');
        setFormEmail(client.email || '');
        setFormAddress(client.address || '');
        setFormQuota(client.defaultDishCount || 4);
        setFormPersonCount(client.personCount || 2);
        setFormAllergies(client.allergies || []);
        setFormDislikes(client.dislikes || '');
        setFormNotes(client.notes || '');
        setIsModalOpen(true);
    };

    const handleSaveClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        try {
            setIsSaving(true);
            const res = await fetch('/api/cooking-ops/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingClient ? editingClient.id : undefined,
                    name: formName,
                    phone: formPhone,
                    email: formEmail,
                    address: formAddress,
                    defaultDishCount: formQuota,
                    personCount: formPersonCount,
                    allergies: formAllergies,
                    dislikes: formDislikes,
                    notes: formNotes
                })
            });

            if (!res.ok) throw new Error('Erreur lors de la sauvegarde');
            setIsModalOpen(false);
            loadClients();
        } catch (err) {
            console.error('Error saving client:', err);
            alert('Impossible de sauvegarder ce client.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClient = async (clientId: string, name: string) => {
        if (!confirm(`Êtes-vous sûre de vouloir supprimer la fiche de ${name} ?`)) return;
        try {
            const res = await fetch(`/api/cooking-ops/admin?id=${clientId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erreur');
            setClients(prev => prev.filter(c => c.id !== clientId));
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const toggleFormAllergy = (tag: string) => {
        setFormAllergies(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    // --- CSV IMPORT LOGIC ---

    const downloadCsvTemplate = () => {
        const headers = ['Nom', 'Telephone', 'Email', 'Adresse', 'Plats', 'Personnes', 'Allergies', 'Aversions', 'Notes'];
        const sampleRows = [
            ['Thibault Martin', '+33 6 12 34 56 78', 'thibault@email.com', '15 rue Saint-Antoine 75004 Paris (Code: 2489)', '5', '2', '', 'Pas de coriandre', 'Plaques vitrocéramique'],
            ['Audrey Dupont', '+33 6 98 76 54 32', 'audrey@email.com', '28 avenue Parmentier 75011 Paris', '5', '2', 'Sans Gluten (Cœliaque), Sans Porc', '', 'Four vapeur'],
            ['Famille Leroy', '+33 6 34 56 78 90', 'leroy@email.com', '12 rue Lepic 75018 Paris (2ème étage)', '4', '4', 'Sans Lactose', 'Pas d\'oignons crus', 'Grand faitout disponible']
        ];

        const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
            [headers.join(';'), ...sampleRows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(';'))].join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', 'modele_clients_elisa.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const parseCsvFile = (content: string) => {
        try {
            setImportError(null);
            const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
            if (lines.length < 2) {
                setImportError('Le fichier CSV est vide ou ne contient aucun en-tête.');
                return;
            }

            // Detect delimiter (, or ;)
            const headerLine = lines[0];
            const delimiter = headerLine.includes(';') ? ';' : ',';

            // Split line respecting quotes
            const splitCsvLine = (line: string): string[] => {
                const result: string[] = [];
                let current = '';
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === delimiter && !inQuotes) {
                        result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                        current = '';
                    } else {
                        current += char;
                    }
                }
                result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                return result;
            };

            const rawHeaders = splitCsvLine(headerLine).map(h => h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());

            // Map header indexes
            const getColIdx = (aliases: string[]) => {
                return rawHeaders.findIndex(h => aliases.some(a => h.includes(a)));
            };

            const nameIdx = getColIdx(['nom', 'name', 'client', 'prenom']);
            const phoneIdx = getColIdx(['tel', 'phone', 'portable', 'mobile']);
            const emailIdx = getColIdx(['email', 'mail', 'courriel']);
            const addressIdx = getColIdx(['adresse', 'address', 'lieu', 'ville']);
            const quotaIdx = getColIdx(['plat', 'dish', 'quota', 'formule', 'recette']);
            const personIdx = getColIdx(['person', 'pax', 'foyer', 'part']);
            const allergyIdx = getColIdx(['allergie', 'regime', 'restriction']);
            const dislikeIdx = getColIdx(['aversion', 'dislike', 'refus', 'aime pas']);
            const notesIdx = getColIdx(['note', 'remarque', 'commentaire', 'cuisine', 'materiel']);

            if (nameIdx === -1) {
                setImportError('Colonne "Nom" introuvable dans le CSV. Veuillez utiliser notre modèle CSV.');
                return;
            }

            const parsed: ParsedCsvClient[] = [];

            for (let i = 1; i < lines.length; i++) {
                const cols = splitCsvLine(lines[i]);
                const rawName = cols[nameIdx];
                if (!rawName || rawName.trim().length === 0) continue;

                const rawAllergies = allergyIdx >= 0 ? cols[allergyIdx] : '';
                const allergies = rawAllergies
                    ? rawAllergies.split(/[,;\/|]+/).map(a => a.trim()).filter(a => a.length > 0)
                    : [];

                const quota = quotaIdx >= 0 && cols[quotaIdx] ? parseInt(cols[quotaIdx], 10) : 4;
                const persons = personIdx >= 0 && cols[personIdx] ? parseInt(cols[personIdx], 10) : 2;

                parsed.push({
                    name: rawName.trim(),
                    phone: phoneIdx >= 0 ? (cols[phoneIdx] || '') : '',
                    email: emailIdx >= 0 ? (cols[emailIdx] || '') : '',
                    address: addressIdx >= 0 ? (cols[addressIdx] || '') : '',
                    defaultDishCount: isNaN(quota) || quota < 1 ? 4 : quota,
                    personCount: isNaN(persons) || persons < 1 ? 2 : persons,
                    allergies,
                    dislikes: dislikeIdx >= 0 ? (cols[dislikeIdx] || '') : '',
                    notes: notesIdx >= 0 ? (cols[notesIdx] || '') : ''
                });
            }

            if (parsed.length === 0) {
                setImportError('Aucune ligne client valide n\'a pu être extraite.');
            } else {
                setParsedCsvClients(parsed);
            }
        } catch (err) {
            console.error('Error parsing CSV:', err);
            setImportError('Erreur de lecture du fichier CSV. Assurez-vous que le format est valide.');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            if (content) parseCsvFile(content);
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = async () => {
        if (parsedCsvClients.length === 0) return;

        try {
            setIsImporting(true);
            const res = await fetch('/api/cooking-ops/admin/import-clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: parsedCsvClients })
            });

            if (!res.ok) throw new Error('Erreur lors de l’importation');
            const data = await res.json();

            setImportSuccessMessage(`${data.importedCount} client(s) importé(s) avec succès !`);
            setParsedCsvClients([]);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            setTimeout(() => {
                setImportSuccessMessage(null);
                setIsImportModalOpen(false);
                loadClients();
            }, 1800);
        } catch (err) {
            console.error('Import error:', err);
            setImportError('Impossible d’enregistrer les clients importés.');
        } finally {
            setIsImporting(false);
        }
    };

    // Filtered clients list
    const filteredClients = useMemo(() => {
        return clients.filter(client => {
            const matchesSearch = 
                client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (client.phone && client.phone.includes(searchQuery)) ||
                (client.allergies && client.allergies.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))) ||
                (client.dislikes && client.dislikes.toLowerCase().includes(searchQuery.toLowerCase()));

            if (!matchesSearch) return false;

            if (allergyFilter === 'allergies') {
                return client.allergies && client.allergies.length > 0;
            }
            if (allergyFilter === 'no_allergies') {
                return !client.allergies || client.allergies.length === 0;
            }

            return true;
        });
    }, [clients, searchQuery, allergyFilter]);

    const totalClients = clients.length;
    const clientsWithAllergies = clients.filter(c => c.allergies && c.allergies.length > 0).length;

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-stone-800 pb-28 font-sans">
            {/* Standardized Header */}
            <AdminPageHeader
                badgeText="ESPACE ADMIN • GESTION DES CLIENTS"
                title="Répertoire & Préférences Clients"
                subtitle="Consultez toutes les fiches clients, gérez le nombre de personnes, les allergies alimentaires et envoyez les liens de choix."
                backHref="/admin"
                backLabel="Retour à l'admin"
                actionElement={
                    <div className="flex items-center gap-2">
                        <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                                setParsedCsvClients([]);
                                setImportError(null);
                                setImportSuccessMessage(null);
                                setIsImportModalOpen(true);
                            }}
                            className="border-stone-300 text-stone-700 hover:bg-stone-100 gap-1.5 shadow-2xs text-xs h-9 px-3.5 rounded-full font-semibold cursor-pointer"
                        >
                            <Upload className="w-3.5 h-3.5 text-stone-600" /> Importer CSV
                        </Button>
                        <Button 
                            size="sm" 
                            onClick={openCreateModal}
                            className="bg-[#E1567A] hover:bg-[#c94567] text-white gap-1.5 shadow-xs text-xs h-9 px-4 rounded-full font-semibold cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Nouveau Client
                        </Button>
                    </div>
                }
            />

            {/* Main Container */}
            <main className="max-w-6xl mx-auto px-4 space-y-6">

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#E1567A] shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-stone-900">{totalClients}</div>
                            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Clients Enregistrés</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-stone-900">{clientsWithAllergies}</div>
                            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Régimes Spécifiques</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <ChefHat className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold font-serif text-stone-900">100%</div>
                            <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Fiches Personnalisées</div>
                        </div>
                    </div>
                </div>

                {/* Search, Filter & View Mode Bar */}
                <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                        <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Rechercher par nom, tél, allergie..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E1567A]"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                        {/* Allergy Filter */}
                        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs">
                            <button
                                onClick={() => setAllergyFilter('all')}
                                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                                    allergyFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                Tous ({clients.length})
                            </button>
                            <button
                                onClick={() => setAllergyFilter('allergies')}
                                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                                    allergyFilter === 'allergies' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                ⚠️ Allergies ({clientsWithAllergies})
                            </button>
                        </div>

                        {/* View Mode Toggle (Cards vs Compact Table) */}
                        <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs">
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === 'cards' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                                }`}
                                title="Vue Fiches / Cartes"
                            >
                                <LayoutGrid className="w-3.5 h-3.5 text-[#E1567A]" />
                                <span className="hidden md:inline">Fiches</span>
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    viewMode === 'table' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                                }`}
                                title="Vue Tableau Compact"
                            >
                                <List className="w-3.5 h-3.5 text-stone-700" />
                                <span className="hidden md:inline">Tableau</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Clients List (Table vs Cards) */}
                {loading ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200">
                        Chargement du répertoire client...
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center text-stone-500 border border-stone-200 space-y-3">
                        <Users className="w-10 h-10 text-stone-300 mx-auto" />
                        <p className="text-sm font-medium">Aucun client ne correspond à votre recherche.</p>
                        <div className="flex items-center justify-center gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsImportModalOpen(true)}
                                className="text-xs rounded-full border-stone-300 gap-1.5"
                            >
                                <Upload className="w-3.5 h-3.5" />
                                Importer un fichier CSV
                            </Button>
                            <Button 
                                onClick={openCreateModal}
                                className="bg-[#E1567A] hover:bg-[#c94567] text-white text-xs rounded-full gap-1.5 font-semibold"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Créer une nouvelle fiche
                            </Button>
                        </div>
                    </div>
                ) : viewMode === 'table' ? (
                    /* COMPACT TABLE VIEW */
                    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-100/90 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="py-3.5 px-4">Client</th>
                                        <th className="py-3.5 px-3">Formule & Foyer</th>
                                        <th className="py-3.5 px-3">Allergies & Aversions</th>
                                        <th className="py-3.5 px-3">Téléphone</th>
                                        <th className="py-3.5 px-3">Adresse & Codes</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100">
                                    {filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-rose-50/20 transition-colors group">
                                            {/* Client Name */}
                                            <td className="py-3 px-4">
                                                <div className="font-serif font-bold text-stone-900 text-sm">
                                                    {client.name}
                                                </div>
                                            </td>

                                            {/* Formula & Household */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[11px] bg-rose-50 text-[#E1567A] border border-rose-200 font-bold px-2 py-0.5 rounded-full">
                                                        👥 {client.personCount || 2} pers
                                                    </span>
                                                    <span className="text-[11px] bg-stone-100 text-stone-700 border border-stone-200 font-medium px-2 py-0.5 rounded-full">
                                                        🍽️ {client.defaultDishCount || 4} plats
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Allergies & Dislikes */}
                                            <td className="py-3 px-3 max-w-[220px]">
                                                {client.allergies && client.allergies.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {client.allergies.map(al => (
                                                            <span key={al} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.2 rounded-md font-bold">
                                                                ⚠️ {al}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-stone-400">Aucune allergie</span>
                                                )}
                                                {client.dislikes && (
                                                    <div className="text-[11px] text-stone-500 truncate mt-0.5" title={client.dislikes}>
                                                        <span className="font-semibold text-stone-600">Aversion:</span> {client.dislikes}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Phone */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                {client.phone ? (
                                                    <div className="flex items-center gap-1.5 text-stone-800 font-medium">
                                                        <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                        <span>{client.phone}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] text-amber-700 italic">Non renseigné</span>
                                                )}
                                            </td>

                                            {/* Address & Codes */}
                                            <td className="py-3 px-3 max-w-[200px]">
                                                {client.address ? (
                                                    <div className="text-stone-700 truncate font-medium" title={client.address}>
                                                        {client.address}
                                                    </div>
                                                ) : (
                                                    <span className="text-stone-400 text-[11px]">-</span>
                                                )}
                                                {client.notes && (
                                                    <div className="text-[10px] text-stone-500 truncate" title={client.notes}>
                                                        🔑 {client.notes}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Actions Toolbar */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {client.phone && (
                                                        <a
                                                            href={getWhatsAppUrl(client)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1.5 rounded-xl hover:bg-emerald-50 text-emerald-600 transition-colors"
                                                            title="Envoyer WhatsApp"
                                                        >
                                                            <MessageCircle className="w-4 h-4" />
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={() => copyClientLink(client.token)}
                                                        className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                                                        title={copiedToken === client.token ? 'Lien copié !' : 'Copier lien choix repas'}
                                                    >
                                                        {copiedToken === client.token ? (
                                                            <Check className="w-4 h-4 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => openEditModal(client)}
                                                        className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                                                        title="Modifier la fiche"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteClient(client.id, client.name)}
                                                        className="p-1.5 rounded-xl hover:bg-red-50 text-stone-300 hover:text-red-600 transition-colors cursor-pointer"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* BIG CARDS GRID VIEW */
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredClients.map((client) => {
                            return (
                                <div 
                                    key={client.id}
                                    className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                                >
                                    <div className="space-y-3">
                                        {/* Client Header */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-serif font-bold text-lg text-stone-900">
                                                    {client.name}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                                    {/* Portion Badge */}
                                                    <span className="text-[11px] bg-rose-50 text-[#E1567A] border border-rose-200 font-bold px-2.5 py-0.5 rounded-full">
                                                        👥 {client.personCount || 2} personnes
                                                    </span>
                                                    {/* Dish Quota Badge */}
                                                    <span className="text-[11px] bg-stone-100 text-stone-700 border border-stone-200 font-medium px-2.5 py-0.5 rounded-full">
                                                        🍽️ {client.defaultDishCount || 4} plats / séance
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action Icons */}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClient(client.id, client.name)}
                                                    className="p-1.5 rounded-xl hover:bg-red-50 text-stone-300 hover:text-red-600 transition-colors cursor-pointer"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Allergies & Dislikes */}
                                        <div className="space-y-1.5">
                                            {client.allergies && client.allergies.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {client.allergies.map((al) => (
                                                        <span 
                                                            key={al}
                                                            className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1"
                                                        >
                                                            ⚠️ {al}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-stone-400">
                                                    Aucune allergie alimentaire
                                                </div>
                                            )}

                                            {client.dislikes && (
                                                <div className="text-xs text-stone-600">
                                                    <span className="font-semibold text-stone-700">Aversions :</span> {client.dislikes}
                                                </div>
                                            )}
                                        </div>

                                        {/* Contact & Address Details */}
                                        <div className="space-y-1 text-xs text-stone-600 pt-1 border-t border-stone-100">
                                            {client.phone ? (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                    <span>{client.phone}</span>
                                                </div>
                                            ) : (
                                                <div className="text-[11px] text-amber-700 flex items-center gap-1.5">
                                                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                                    <span>Numéro de téléphone manquant</span>
                                                </div>
                                            )}

                                            {client.address && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                                    <span className="line-clamp-1">{client.address}</span>
                                                </div>
                                            )}

                                            {client.notes && (
                                                <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-xl border border-stone-200 mt-1">
                                                    📝 {client.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons Toolbar */}
                                    <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2 text-xs">
                                        {client.phone ? (
                                            <a
                                                href={getWhatsAppUrl(client)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full"
                                            >
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="w-full text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs h-8 px-2 rounded-xl font-semibold gap-1.5 cursor-pointer"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                    WhatsApp
                                                </Button>
                                            </a>
                                        ) : (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => openEditModal(client)}
                                                className="w-full text-amber-700 border-amber-300 hover:bg-amber-50 text-xs h-8 px-2 rounded-xl font-semibold gap-1 cursor-pointer"
                                            >
                                                + Ajouter tél
                                            </Button>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => copyClientLink(client.token)}
                                            className="w-full border-stone-300 text-stone-700 hover:bg-stone-100 text-xs h-8 px-2 rounded-xl font-semibold gap-1.5 cursor-pointer"
                                        >
                                            {copiedToken === client.token ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                    Lien copié !
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-3.5 h-3.5 text-stone-500" />
                                                    Lien Choix
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* CSV Import Modal */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-[#E1567A]" />
                            Importer des clients depuis un fichier CSV
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-2 text-xs">
                        {/* Step 1: Download Template */}
                        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <h4 className="font-bold text-stone-900 text-xs">
                                    Modèle CSV recommandé pour Elisa
                                </h4>
                                <p className="text-stone-600 text-[11px]">
                                    Téléchargez le fichier pré-rempli, complétez vos clients sur Excel ou Google Sheets, puis ré-importez-le ici.
                                </p>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline"
                                onClick={downloadCsvTemplate}
                                className="border-rose-300 bg-white text-[#E1567A] hover:bg-rose-100 font-semibold gap-1.5 rounded-xl h-8 px-3 shrink-0"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Télécharger le modèle (.csv)
                            </Button>
                        </div>

                        {/* Step 2: Upload File Box */}
                        <div>
                            <label className="font-bold block text-stone-700 mb-1.5 uppercase tracking-wider text-[11px]">
                                Sélectionnez ou glissez votre fichier CSV :
                            </label>
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                accept=".csv,text/csv" 
                                onChange={handleFileUpload}
                                className="w-full text-xs p-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-[#E1567A] bg-stone-50/50 cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#E1567A] file:text-white hover:file:bg-[#c94567]"
                            />
                        </div>

                        {/* Error Alert */}
                        {importError && (
                            <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-2xl flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>{importError}</span>
                            </div>
                        )}

                        {/* Success Message */}
                        {importSuccessMessage && (
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-3 rounded-2xl flex items-center gap-2 font-bold">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{importSuccessMessage}</span>
                            </div>
                        )}

                        {/* Step 3: Preview Table */}
                        {parsedCsvClients.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-stone-100">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-stone-800">
                                        Prévisualisation ({parsedCsvClients.length} clients détectés) :
                                    </h4>
                                    <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                                        Format valide ✓
                                    </span>
                                </div>

                                <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
                                    <table className="w-full text-left text-[11px]">
                                        <thead className="bg-stone-100 text-stone-700 sticky top-0 font-bold border-b border-stone-200">
                                            <tr>
                                                <th className="p-2">Nom</th>
                                                <th className="p-2">Téléphone</th>
                                                <th className="p-2">Formule</th>
                                                <th className="p-2">Foyer</th>
                                                <th className="p-2">Allergies</th>
                                                <th className="p-2">Adresse</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-100">
                                            {parsedCsvClients.map((c, idx) => (
                                                <tr key={idx} className="hover:bg-stone-50">
                                                    <td className="p-2 font-bold text-stone-900">{c.name}</td>
                                                    <td className="p-2 text-stone-600">{c.phone || '-'}</td>
                                                    <td className="p-2 text-stone-600">{c.defaultDishCount} plats</td>
                                                    <td className="p-2 text-stone-600 font-bold text-[#E1567A]">{c.personCount} pers</td>
                                                    <td className="p-2">
                                                        {c.allergies.length > 0 ? (
                                                            <span className="text-red-700 font-semibold">{c.allergies.join(', ')}</span>
                                                        ) : (
                                                            <span className="text-stone-400">Aucune</span>
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-stone-500 line-clamp-1 max-w-[140px]">{c.address || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Button 
                                    onClick={handleConfirmImport}
                                    disabled={isImporting}
                                    className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white mt-2 rounded-xl h-10 font-bold shadow-xs gap-1.5"
                                >
                                    <Check className="w-4 h-4" />
                                    {isImporting 
                                        ? 'Importation en cours...' 
                                        : `Confirmer et importer les ${parsedCsvClients.length} clients`}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create & Edit Single Client Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-lg bg-white rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-xl font-bold">
                            {editingClient ? `Modifier : ${editingClient.name}` : 'Nouvelle Fiche Client'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveClient} className="space-y-3.5 py-2 text-xs">
                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Nom & Prénom *</label>
                            <input 
                                type="text" 
                                required 
                                value={formName}
                                onChange={e => setFormName(e.target.value)}
                                placeholder="Ex: Thibault Martin"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Nombre de personnes (foyer)</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={12}
                                    value={formPersonCount}
                                    onChange={e => setFormPersonCount(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Nombre de plats par séance</label>
                                <input 
                                    type="number" 
                                    min={1} 
                                    max={8}
                                    value={formQuota}
                                    onChange={e => setFormQuota(Number(e.target.value))}
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Téléphone (WhatsApp)</label>
                                <input 
                                    type="text" 
                                    value={formPhone}
                                    onChange={e => setFormPhone(e.target.value)}
                                    placeholder="+33 6 12 34 56 78"
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="font-semibold block text-stone-700 mb-1">Email (optionnel)</label>
                                <input 
                                    type="email" 
                                    value={formEmail}
                                    onChange={e => setFormEmail(e.target.value)}
                                    placeholder="thibault@email.com"
                                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Adresse & Code d&apos;accès</label>
                            <input 
                                type="text" 
                                value={formAddress}
                                onChange={e => setFormAddress(e.target.value)}
                                placeholder="15 rue Saint-Antoine, 75004 Paris (Code: 2489)"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Allergies Médicales & Régimes</label>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {COMMON_ALLERGIES.map(tag => {
                                    const active = formAllergies.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => toggleFormAllergy(tag)}
                                            className={`px-2.5 py-1 rounded-full border transition-all text-[11px] cursor-pointer ${
                                                active ? 'bg-[#E1567A] text-white border-[#E1567A] font-bold' : 'bg-stone-50 text-stone-600 border-stone-200'
                                            }`}
                                        >
                                            {tag} {active && '✓'}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Aversions alimentaires (ingrédients refusés)</label>
                            <input 
                                type="text" 
                                value={formDislikes}
                                onChange={e => setFormDislikes(e.target.value)}
                                placeholder="Ex: Pas de coriandre, pas d'oignons crus, pas de poivrons"
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="font-semibold block text-stone-700 mb-1">Notes cuisine & matériel</label>
                            <textarea 
                                rows={2}
                                value={formNotes}
                                onChange={e => setFormNotes(e.target.value)}
                                placeholder="Ex: Plaques induction, four vapeur, chien affectueux..."
                                className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-[#E1567A] focus:outline-none"
                            />
                        </div>

                        <Button 
                            type="submit" 
                            disabled={isSaving}
                            className="w-full bg-[#E1567A] hover:bg-[#c94567] text-white mt-2 rounded-xl h-10 font-bold cursor-pointer"
                        >
                            {isSaving ? 'Enregistrement...' : editingClient ? 'Mettre à jour la fiche' : 'Créer la fiche client'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
