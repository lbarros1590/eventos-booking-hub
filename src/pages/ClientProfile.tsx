import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail, Phone, Calendar as CalendarIcon, MapPin, ShieldAlert, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ClientProfile = () => {
    const { profile, user, updateProfile, signOut } = useAuth();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        cpf: '',
        rg: '',
        address: '',
        birth_date: '',
    });

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                phone: profile.phone || '',
                cpf: profile.cpf || '',
                rg: profile.rg || '',
                address: profile.address || '',
                birth_date: profile.birth_date || '',
            });
        }
    }, [profile]);

    const handleInputChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name || !formData.phone) {
            toast.error('Nome e telefone são campos obrigatórios.');
            return;
        }

        setLoading(true);
        const { error } = await updateProfile({
            name: formData.name,
            phone: formData.phone,
            cpf: formData.cpf || null,
            rg: formData.rg || null,
            address: formData.address || null,
            birth_date: formData.birth_date || null,
        });

        if (error) {
            toast.error('Erro ao salvar os dados.');
        } else {
            toast.success('Seus dados foram atualizados com sucesso!');
        }
        setLoading(false);
    };

    const handleDeactivateAccount = async () => {
        setDeleting(true);
        const { error } = await updateProfile({
            is_active: false
        } as any);

        if (error) {
            toast.error('Erro ao inativar conta.');
            setDeleting(false);
            setDeleteDialogOpen(false);
        } else {
            toast.success('Sua conta foi desativada. Saindo...');
            setTimeout(() => {
                signOut();
            }, 1500);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                        Meu Perfil
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie seus dados pessoais
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Dados Cadastrais
                        </CardTitle>
                        <CardDescription>
                            Mantenha suas informações atualizadas para facilitar suas reservas.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="pl-9"
                                        placeholder="Seu nome"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail (Login)</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="pl-9 bg-muted"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">O e-mail de acesso não pode ser alterado.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="pl-9"
                                        placeholder="(XX) 9XXXX-XXXX"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="birth_date">Data de Nascimento</Label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="cpf"
                                        value={formData.cpf}
                                        onChange={(e) => handleInputChange('cpf', e.target.value)}
                                        className="pl-9"
                                        placeholder="000.000.000-00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="rg">RG</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="rg"
                                        value={formData.rg}
                                        onChange={(e) => handleInputChange('rg', e.target.value)}
                                        className="pl-9"
                                        placeholder="Apenas números e letras"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label htmlFor="address">Endereço Completo</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    className="pl-9"
                                    placeholder="Rua, Número, Bairro, Cidade - Estado"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 border-t border-border pt-6">
                        <Button
                            onClick={handleSave}
                            disabled={loading || !formData.name || !formData.phone}
                            className="bg-gradient-primary hover:opacity-90"
                        >
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Salvar Alterações
                        </Button>
                    </CardFooter>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/30 border">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <ShieldAlert className="w-5 h-5" />
                            Zona de Perigo
                        </CardTitle>
                        <CardDescription>
                            Ações irreversíveis relacionadas à sua conta
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            Ao desativar sua conta, você não conseguirá mais acessar o painel nem solicitar novas reservas.
                            Reservas passadas e informações essenciais permanecerão arquivadas para fins legais e de histórico do espaço.
                        </p>
                        <Button
                            variant="destructive"
                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            Desativar Minha Conta
                        </Button>
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-destructive">Tem certeza que deseja desativar sua conta?</DialogTitle>
                            <DialogDescription>
                                Seu acesso será revogado imediatamente e você será desconectado.
                                Esta ação não pode ser desfeita por você (será necessário contatar a administração para reativar).
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleDeactivateAccount} disabled={deleting}>
                                {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Sim, Desativar Conta
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default ClientProfile;
