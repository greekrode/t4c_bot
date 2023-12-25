ab =  new ActiveXObject("Broker.Application");
var sym = WScript.Arguments(0);
exportPath = "C:\\Users\\Administrator\\Documents\\AmiExport\\";

docs = ab.Documents();
docs.close();

ab.loadLayout ( "C:\\Program Files\\AmiBroker\\Semar\\Layouts\\\custom_pivot.awl");

ab.ActiveDocument.Name = sym 
aw = ab.ActiveWindow;

aw.SelectedTab = 2;
filename = sym + "_pivot_m.PNG";
ab.RefreshAll();
WScript.Sleep(250);
aw.ExportImage(exportPath + filename, 1920, 1080);