import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do arquivo .env na raiz do projeto
dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function getOwnerPhoneNumber(): Promise<string> {
    try {
        const { data, error } = await supabase
            .from('venue_settings')
            .select('owner_phone')
            .limit(1)
            .single();

        if (error) {
            console.warn('⚠️  [SERVER] Erro ao buscar telefone da proprietária no banco. Usando fallback.', error.message);
            return '5565992860607'; // Fallback
        }

        if (data && data.owner_phone) {
            return data.owner_phone;
        }

        return '5565992860607'; // Fallback caso o campo não exista ou esteja nulo
    } catch (error) {
        console.error('❌ [SERVER] Erro ao acessar o Supabase no servidor:', error);
        return '5565992860607';
    }
}
