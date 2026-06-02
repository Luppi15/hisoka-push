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

        string rootDir = AppDomain.CurrentDomain.BaseDirectory;
        string pythonPath = Path.Combine(rootDir, ".venv", "Scripts", "python.exe");
        string appScript = Path.Combine(rootDir, "app.py");

        // Validar caminhos e tentar diretório pai se necessário (retrocompatibilidade)
        if (!File.Exists(pythonPath) || !File.Exists(appScript))
        {
            string parentDir = Path.GetFullPath(Path.Combine(rootDir, ".."));
            string parentPython = Path.Combine(parentDir, ".venv", "Scripts", "python.exe");
            string parentScript = Path.Combine(parentDir, "app.py");

            if (File.Exists(parentPython) && File.Exists(parentScript))
            {
                rootDir = parentDir;
                pythonPath = parentPython;
                appScript = parentScript;
            }
        }

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

    static string GetChromiumPath()
    {
        // 1. Procurar Microsoft Edge no Registro do Windows
        try
        {
            using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"))
            {
                if (key != null)
                {
                    string path = key.GetValue("") as string;
                    if (!string.IsNullOrEmpty(path) && File.Exists(path))
                        return path;
                }
            }
        }
        catch {}

        // 2. Procurar Google Chrome no Registro do Windows
        try
        {
            using (var key = Microsoft.Win32.Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe"))
            {
                if (key != null)
                {
                    string path = key.GetValue("") as string;
                    if (!string.IsNullOrEmpty(path) && File.Exists(path))
                        return path;
                }
            }
        }
        catch {}

        // 3. Fallbacks para locais padrão do Edge
        string[] edgePaths = new string[] {
            @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe")
        };
        foreach (string path in edgePaths)
        {
            if (File.Exists(path)) return path;
        }

        // 4. Fallbacks para locais padrão do Chrome
        string[] chromePaths = new string[] {
            @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            @"C:\Program Files\Google\Chrome\Application\chrome.exe",
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
        };
        foreach (string path in chromePaths)
        {
            if (File.Exists(path)) return path;
        }

        return null;
    }

    static void OpenBrowser(string url)
    {
        string chromiumPath = GetChromiumPath();
        if (chromiumPath != null)
        {
            Console.ForegroundColor = ConsoleColor.Magenta;
            Console.WriteLine("\n[Launcher] Iniciando o Hisoka Push V2 em modo Aplicativo...");
            Console.ResetColor();
            try
            {
                Process.Start(new ProcessStartInfo(chromiumPath, "--app=\"" + url + "\"") { UseShellExecute = false });
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine("[Aviso] Erro ao iniciar em modo App: " + ex.Message);
            }
        }

        // Fallback se não encontrar Chromium
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
