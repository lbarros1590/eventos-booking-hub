import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { KeyRound, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const navigate = useNavigate();

    // Supabase sends the user here after clicking the reset link.
    // The session is set automatically via the hash fragment.
    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Ready to accept new password
            }
        });
        return () => listener.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            toast.error(error.message || 'Erro ao redefinir senha.');
        } else {
            setDone(true);
            toast.success('Senha redefinida com sucesso!');
            setTimeout(() => navigate('/login'), 3000);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Card className="border-border shadow-lg">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4">
                            <span className="text-primary-foreground font-display font-bold text-2xl">EJ</span>
                        </div>
                        <CardTitle className="font-display text-2xl">
                            {done ? 'Senha redefinida!' : 'Nova senha'}
                        </CardTitle>
                        <CardDescription>
                            {done
                                ? 'Sua senha foi atualizada. Redirecionando para o login...'
                                : 'Digite e confirme sua nova senha.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {done ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <CheckCircle className="w-16 h-16 text-success" />
                                <p className="text-muted-foreground text-sm text-center">
                                    Você será redirecionado para a tela de login em instantes.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Nova senha</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        'Salvando...'
                                    ) : (
                                        <>
                                            <KeyRound className="mr-2" size={20} />
                                            Redefinir senha
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ResetPassword;
