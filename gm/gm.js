ab = new ActiveXObject("Broker.Application");
var sym = WScript.Arguments(0);
exportPath = "C:\\Users\\Administrator\\Documents\\AmiExport\\";

ab.loadLayout("C:\\Program Files\\AmiBroker\\Semar\\Layouts\\custom.awl");

ab.ActiveDocument.Name = sym;
aw = ab.ActiveWindow;

aw.SelectedTab = 25;
filename = sym + "_gm.PNG";
ab.RefreshAll();
WScript.Sleep(250);
aw.ExportImage(exportPath + filename, 1920, 1080);
