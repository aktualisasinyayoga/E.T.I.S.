import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxcvbwpgxaxlipmrvakh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Y3Zid3BneGF4bGlwbXJ2YWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzkwOTAsImV4cCI6MjA5MzU1NTA5MH0.fy9Z9bQQ4QEDfZquH2eA8ib7bJB6C9q4H_8vPGpknuo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function deleteCert() {
  const { data, error } = await supabase
    .from('certificates')
    .delete()
    .eq('employee_name', 'MUHAMMAD YOGA RIDWAN, S.KOM')
    .eq('nama_pelatihan', 'Training Officer Course')
    .select();

  if (error) {
    console.error('Error deleting:', error);
  } else {
    console.log('Deleted:', data);
  }
}

deleteCert();
