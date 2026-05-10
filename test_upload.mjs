import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxcvbwpgxaxlipmrvakh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4Y3Zid3BneGF4bGlwbXJ2YWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NzkwOTAsImV4cCI6MjA5MzU1NTA5MH0.fy9Z9bQQ4QEDfZquH2eA8ib7bJB6C9q4H_8vPGpknuo';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  const fileContent = Buffer.from('Hello world', 'utf-8');
  
  const { data, error } = await supabase.storage
    .from('certificates')
    .upload('test_upload.txt', fileContent, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }
}

testUpload();
