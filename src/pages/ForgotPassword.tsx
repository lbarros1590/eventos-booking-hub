import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${siteUrl}/reset-password`,
        });

        if (error) {
            toast.error(error.message || 'Erro ao enviar email de recuperação.');
        } else {
            setSent(true);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Voltar para o login
                </Link>

                <Card className="border-border shadow-lg">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4">
                            <span className="text-primary-foreground font-display font-bold text-2xl">EJ</span>
                        </div>
                        <CardTitle className="font-display text-2xl">
                            {sent ? 'Email enviado!' : 'Recuperar senha'}
                        </CardTitle>
                        <CardDescription>
                            {sent
                                ? 'Verifique sua caixa de entrada e clique no link para redefinir sua senha.'
                                : 'Informe seu email cadastrado e enviaremos um link para redefinir sua senha.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sent ? (
                            <div className="flex flex-col items-center gap-4 py-4">
                                <CheckCircle className="w-16 h-16 text-success" />
                                <p className="text-center text-muted-foreground text-sm">
                                    Um email foi enviado para <strong>{email}</strong> com as instruções para redefinir sua senha.
                                </p>
                                <p className="text-center text-muted-foreground text-xs">
                                    Não recebeu? Verifique a pasta de spam ou tente novamente.
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => { setSent(false); setEmail(''); }}
                                >
                                    Tentar com outro email
                                </Button>
                                <Link to="/login" className="text-primary hover:underline text-sm">
                                    Voltar para o login
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email cadastrado</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="seu@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-primary"
                                    size="lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        'Enviando...'
                                    ) : (
                                        <>
                                            <Mail className="mr-2" size={20} />
                                            Enviar link de recuperação
                                        </>
                                    )}
                                </Button>

                                <div className="mt-4 text-center text-sm">
                                    <span className="text-muted-foreground">Lembrou a senha? </span>
                                    <Link to="/login" className="text-primary hover:underline font-medium">
                                        Entrar
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ForgotPassword;
