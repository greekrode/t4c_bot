ab =  new ActiveXObject("Broker.Application");
var sym = WScript.Arguments(0);
exportPath = "C:\\Users\\Administrator\\Documents\\AmiExport\\";

ab.loadLayout ( "C:\\Program Files\\AmiBroker\\Semar\\Layouts\\\custom_w.awl");

ab.ActiveDocument.Name = sym 
aw = ab.ActiveWindow;

aw.SelectedTab = 0;
filename = sym + "_adv_w.PNG";
ab.RefreshAll();
WScript.Sleep(250);
aw.ExportImage(exportPath + filename, 2560, 1440);