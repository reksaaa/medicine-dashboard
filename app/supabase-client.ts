import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jsysbnfhpmppbwavgxyr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzeXNibmZocG1wcGJ3YXZneHlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyODEzMDAsImV4cCI6MjA1MDg1NzMwMH0.7M4vyUh7Hr8PDBEEZ4xY0MuboUegBl7h2EqOaIsjfyM"
);

export default supabase;
