using System.Runtime.InteropServices;
using System.Text;

namespace printing_service.Services;

// Sends raw bytes to a named Windows printer via the spooler, bypassing GDI.
// Required for ZPL and any other page-description language that must reach the
// printer firmware unmodified.
internal static class RawPrinter
{
    [DllImport("winspool.Drv", CharSet = CharSet.Ansi, SetLastError = true)]
    private static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pDefault);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", CharSet = CharSet.Ansi, SetLastError = true)]
    private static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DocInfoA di);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", SetLastError = true)]
    private static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    private struct DocInfoA
    {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string? pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    public static void Send(string printerName, byte[] data)
    {
        if (!OpenPrinter(printerName, out var hPrinter, IntPtr.Zero))
            throw new InvalidOperationException(
                $"Cannot open printer '{printerName}'. Win32 error: {Marshal.GetLastWin32Error()}");

        try
        {
            var di = new DocInfoA { pDocName = "RAW", pOutputFile = null, pDataType = "RAW" };

            if (!StartDocPrinter(hPrinter, 1, ref di))
                throw new InvalidOperationException(
                    $"StartDocPrinter failed. Win32 error: {Marshal.GetLastWin32Error()}");

            var ptr = Marshal.AllocCoTaskMem(data.Length);
            try
            {
                Marshal.Copy(data, 0, ptr, data.Length);
                if (!WritePrinter(hPrinter, ptr, data.Length, out var written) || written != data.Length)
                    throw new InvalidOperationException(
                        $"WritePrinter incomplete ({written}/{data.Length} bytes). Win32 error: {Marshal.GetLastWin32Error()}");
            }
            finally
            {
                Marshal.FreeCoTaskMem(ptr);
            }

            EndDocPrinter(hPrinter);
        }
        finally
        {
            ClosePrinter(hPrinter);
        }
    }

    // ZPL is plain ASCII — detect by extension and by the ^XA start-of-label marker.
    public static bool IsZpl(string filePath, byte[] data)
    {
        var ext = Path.GetExtension(filePath);
        if (ext.Equals(".zpl", StringComparison.OrdinalIgnoreCase) ||
            ext.Equals(".lbl", StringComparison.OrdinalIgnoreCase))
            return true;

        // Content sniff: ZPL labels always open with ^XA
        try
        {
            var head = Encoding.ASCII.GetString(data, 0, Math.Min(64, data.Length));
            return head.Contains("^XA", StringComparison.OrdinalIgnoreCase);
        }
        catch { return false; }
    }

    // ZPL commands must be terminated with LF (0x0A), not CRLF.
    public static byte[] NormaliseZpl(byte[] data)
    {
        // Replace CRLF with LF, then ensure the payload ends with LF
        var text = Encoding.UTF8.GetString(data)
            .Replace("\r\n", "\n")
            .Replace("\r", "\n");

        if (!text.EndsWith('\n'))
            text += '\n';

        return Encoding.UTF8.GetBytes(text);
    }
}
