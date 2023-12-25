ab = new ActiveXObject("Broker.Application");
var sym = WScript.Arguments(0);
exportPath = "C:\\Users\\Administrator\\Documents\\AmiExport\\";

ab.loadLayout(
  "C:\\Program Files\\AmiBroker\\Semar\\Layouts\\custom_1m.awl"
);

ab.ActiveDocument.Name = sym;
ab.RefreshAll();
aw = ab.ActiveWindow;

aw.SelectedTab = 27;
filename = sym + "_ss_1m.PNG";
ab.RefreshAll();
WScript.Sleep(250);
aw.ExportImage(exportPath + filename, 2560, 1440);
