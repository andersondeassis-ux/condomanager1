
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com as credenciais fornecidas
const SUPABASE_URL = 'https://znmccmhzjcutgdnfhefj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpubWNjbWh6amN1dGdkbmZoZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDkyMjgsImV4cCI6MjA3OTMyNTIyOH0.v525u82bSpzHVGr7rBTS4rzjqdy3fW26c24PETohqc8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
