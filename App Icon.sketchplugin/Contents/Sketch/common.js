@import 'sandbox.js'

//--------------------------------------
//  Common variables for easy access
//--------------------------------------

var selection,
	plugin,
	currentCommand,
	currentCommandID,
	doc,
	currentPage,
	currentArtboard,
	stage,
	pluginName,
	scriptPath,
	scriptURL,
	scriptFolder,
	pluginDomain,
	isRemote = false

//--------------------------------------
//  Parse Context - Sketch 3.3 onwards
//--------------------------------------

function parseContext(context, remote) {
	if(typeof remote !== 'undefined') isRemote = remote;
	selection = context.selection;
	currentCommand = context.command;
	doc = context.document;
	scriptPath = context.scriptPath;
	scriptURL = context.scriptURL;
	plugin = context.plugin;

	currentPage = [doc currentPage];
	currentArtboard = [currentPage currentArtboard];
	stage = currentArtboard ? currentArtboard : currentPage;
	currentCommandID = [currentCommand identifier];
	if (!isRemote) {
		pluginName = [plugin name];
		pluginDomain = [plugin identifier];
	}
	scriptFolder = [scriptPath stringByDeletingLastPathComponent];
}

function getSketchVersionNumber() {
	const version = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleShortVersionString"]
	var versionNumber = version.stringByReplacingOccurrencesOfString_withString(".", "") + ""
	while(versionNumber.length !== 3) {
		versionNumber += "0"
	}
	return parseInt(versionNumber)
}

//--------------------------------------
//  Checking Layer Types
//--------------------------------------

function is(layer, theClass){
  var klass = [layer class];
  return klass === theClass;
}

function exportLayerToPath(layer, path, scale, format, suffix) {
     if(getSketchVersionNumber() >= 410) {
        scale = (typeof scale !== 'undefined') ? scale : 1
        suffix = (typeof suffix !== 'undefined') ? suffix : ""
        format = (typeof format !== 'undefined') ? format : "png"

        var slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject()
        slice.scale = scale;
        slice.format = format;

        doc.saveArtboardOrSlice_toFile(slice, path);

        var rect = layer.absoluteRect().rect()
        return {
          x: Math.round(rect.origin.x),
          y: Math.round(rect.origin.y),
          width: Math.round(rect.size.width),
          height: Math.round(rect.size.height)
        }
     }

	if(getSketchVersionNumber() >= 350) {

		var rect = layer.absoluteRect().rect(),
			slice = [MSExportRequest requestWithRect:rect scale:scale],
			layerName = layer.name() + ((typeof suffix !== 'undefined') ? suffix : ""),
			format = (typeof format !== 'undefined') ? format : "png";

		slice.setShouldTrim(0)
		slice.setSaveForWeb(1)
		slice.configureForLayer(layer)
		slice.setName(layerName)
		slice.setFormat(format)
		doc.saveArtboardOrSlice_toFile(slice, path)

		return {
		    x: Math.round(rect.origin.x),
		    y: Math.round(rect.origin.y),
		    width: Math.round(rect.size.width),
		    height: Math.round(rect.size.height)
		}
	}

	[[layer exportOptions] addExportSize]
	var exportSize = [[[[layer exportOptions] sizes] array] lastObject],
		rect = [[layer absoluteRect] rect],
		scale = (typeof scale !== 'undefined') ? scale : 1,
		suffix = (typeof suffix !== 'undefined') ? suffix : "",
		format = (typeof format !== 'undefined') ? format : "png"
	exportSize.scale = scale
	exportSize.name = suffix
	exportSize.format = format
	var slice = getSketchVersionNumber() >= 344 ? [MSSliceMaker sliceFromExportSize:exportSize layer:layer inRect:rect useIDForName:false] : [MSSliceMaker sliceFromExportSize:exportSize layer:layer inRect:rect]
	[doc saveArtboardOrSlice:slice toFile: path]
	[exportSize remove]

	return {
	    x: Math.round(rect.origin.x),
	    y: Math.round(rect.origin.y),
	    width: Math.round(rect.size.width),
	    height: Math.round(rect.size.height)
	}
}

function createFolderAtPath(pathString) {
	var fileManager = [NSFileManager defaultManager];
	if([fileManager fileExistsAtPath:pathString]) return true;
	return [fileManager createDirectoryAtPath:pathString withIntermediateDirectories:true attributes:nil error:nil];
}

function writeTextToFile(text, filePath) {
	var t = [NSString stringWithFormat:@"%@", text],
		f = [NSString stringWithFormat:@"%@", filePath];
    return [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil];
}

function stringify(obj, prettyPrinted) {
	var prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
		jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:nil];
	return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

var keyPref = 'AppAssetExportSketch';

function saveValue(key, value) {
    key = keyPref + key;
    if (typeof value === "boolean") {
      [[NSUserDefaults standardUserDefaults] setBool:value forKey:key]
    } else {
      [[NSUserDefaults standardUserDefaults] setObject:value forKey:key]
    }

    [[NSUserDefaults standardUserDefaults] synchronize]
  }

  function loadValue(key,valType){
   try {
    var prefs = NSUserDefaults.standardUserDefaults();

    if (valType  === "boolean") {
         return prefs.boolForKey(keyPref + key);
    } else {
      return prefs.stringForKey(keyPref + key);
    }

  } catch (e) {}
}

