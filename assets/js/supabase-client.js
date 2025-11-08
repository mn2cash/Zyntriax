/* Supabase client bootstrap (UMD). Replace placeholders below with your project values.
   1) Get your values from Supabase Dashboard → Project Settings → API
   2) Set the Site URL and Redirect URLs in Auth Settings to include your local/prod URLs
*/
(function(){
  if (!window.supabase) {
    console.error('Supabase UMD library not loaded. Ensure the CDN script is included before this file.');
    return;
  }
  // TODO: Replace with your actual values
  var SUPABASE_URL = 'https://jbgkumzoitqfspghglyf.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiZ2t1bXpvaXRxZnNwZ2hnbHlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNzQ1OTYsImV4cCI6MjA3Mzk1MDU5Nn0.F7dYn0Tk6RPI2vbNPLsuBlbHCjn7Ma9E9i4Qnav1pt8';

  try {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
  }
})();

