using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

class Program
{
    static void Main(string[] args)
    {
        Console.Title = "Hisoka Push V2";
        Console.ForegroundColor = ConsoleColor.Cyan;
        Console.WriteLine("===================================================");
        Console.WriteLine("        Hisoka Push V2 - Servidor Local            ");
        Console.WriteLine("===================================================");
        Console.ResetColor();

        string currentDir = AppDomain.CurrentDomain.BaseDirectory;
        string rootDir = currentDir;

        // Verificar se estamos executando de dentro da pasta 'dist'
        string parentDir = Path.GetFullPath(Path.Combine(currentDir, ".."));
        
        string pythonPath = Path.Combine(rootDir, ".venv", "Scripts", "python.exe");
        string appScript = Path.Combine(rootDir, "app.py");

        if (!File.Exists(pythonPath) || !File.Exists(appScript))
        {
            // Tenta no diretório pai
            if (File.Exists(Path.Combine(parentDir, ".venv", "Scripts", "python.exe")) && 
                File.Exists(Path.Combine(parentDir, "app.py")))
            {
                rootDir = parentDir;
                pythonPath = Path.Combine(rootDir, ".venv", "Scripts", "python.exe");
                appScript = Path.Combine(rootDir, "app.py");
            }
        }

        // Validar caminhos
        if (!File.Exists(pythonPath))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[ERRO] Ambiente virtual Python não encontrado!");
            Console.WriteLine("Esperado em: " + pythonPath);
            Console.ResetColor();
            Console.WriteLine("\nPressione qualquer tecla para sair...");
            Console.ReadKey();
            return;
        }

        if (!File.Exists(appScript))
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[ERRO] Script principal 'app.py' não encontrado!");
            Console.WriteLine("Esperado em: " + appScript);
            Console.ResetColor();
            Console.WriteLine("\nPressione qualquer tecla para sair...");
            Console.ReadKey();
            return;
        }

        // Ler porta do .env no diretório correto do projeto
        string envPath = Path.Combine(rootDir, ".env");
        int port = 5000;
        if (File.Exists(envPath))
        {
            try
            {
                string[] lines = File.ReadAllLines(envPath);
                foreach (string line in lines)
                {
                    string trimmed = line.Trim();
                    if (trimmed.StartsWith("FLASK_PORT="))
                    {
                        string val = trimmed.Substring("FLASK_PORT=".Length).Trim();
                        int p;
                        if (int.TryParse(val, out p))
                        {
                            port = p;
                        }
                    }
                }
            }
            catch {}
        }

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine("[INFO] Iniciando Python e Flask na porta " + port + "...");
        Console.WriteLine("[INFO] Pasta de trabalho: " + rootDir);
        Console.ResetColor();

        ProcessStartInfo psi = new ProcessStartInfo();
        psi.FileName = pythonPath;
        psi.Arguments = "\"" + appScript + "\"";
        psi.WorkingDirectory = rootDir;
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;
        psi.CreateNoWindow = true;

        Process process = new Process();
        process.StartInfo = psi;

        bool browserOpened = false;
        string targetUrl = "http://127.0.0.1:" + port;

        // Handler de saída e erro
        DataReceivedEventHandler outputHandler = (sender, e) =>
        {
            if (e.Data != null)
            {
                Console.WriteLine(e.Data);
                
                // Abre o navegador quando detecta inicialização
                if (!browserOpened && (e.Data.Contains("Running on") || e.Data.Contains("Serving Flask app") || e.Data.Contains("Port " + port)))
                {
                    browserOpened = true;
                    OpenBrowser(targetUrl);
                }
            }
        };

        process.OutputDataReceived += outputHandler;
        process.ErrorDataReceived += outputHandler;

        try
        {
            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();
        }
        catch (Exception ex)
        {
            Console.ForegroundColor = ConsoleColor.Red;
            Console.WriteLine("[ERRO] Falha ao iniciar processo Python: " + ex.Message);
            Console.ResetColor();
            Console.WriteLine("\nPressione qualquer tecla para sair...");
            Console.ReadKey();
            return;
        }

        // Lidar com fechamento via Ctrl+C
        Console.CancelKeyPress += (sender, e) =>
        {
            e.Cancel = true;
            Console.WriteLine("\nEncerramento solicitado pelo usuário...");
            StopProcess(process);
            Environment.Exit(0);
        };

        // Fallback de abertura do navegador após 2.5 segundos
        Thread fallbackThread = new Thread(() =>
        {
            Thread.Sleep(2500);
            if (!browserOpened)
            {
                browserOpened = true;
                OpenBrowser(targetUrl);
            }
        });
        fallbackThread.IsBackground = true;
        fallbackThread.Start();

        // Espera o Flask terminar
        process.WaitForExit();
        Console.WriteLine("\n[INFO] Servidor Hisoka foi encerrado.");
    }

    static void OpenBrowser(string url)
    {
        Console.ForegroundColor = ConsoleColor.Magenta;
        Console.WriteLine("\n[Launcher] Abrindo o painel do Hisoka no seu navegador padrão...");
        Console.ResetColor();
        try
        {
            Process.Start(new ProcessStartInfo(url) { UseShellExecute = true });
        }
        catch (Exception ex)
        {
            Console.WriteLine("[Aviso] Não foi possível abrir o navegador: " + ex.Message);
        }
    }

    static void StopProcess(Process p)
    {
        try
        {
            if (p != null && !p.HasExited)
            {
                p.Kill();
            }
        }
        catch {}
    }
}
