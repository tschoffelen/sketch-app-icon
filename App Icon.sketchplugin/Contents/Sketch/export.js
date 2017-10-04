@import 'common.js'

var doc,
  handler,
  currentLayer,
  appIconSetPath,
  exportPath = loadValue('xcodeProjectPath') || '~/Downloads',
  iOSSuffixArray = ['60@2x', '60@3x', '76', '76@2x', 'Small-40', 'Small-40@2x',
    'Small-40@3x', 'Small', 'Small@2x', 'Small@3x', '83.5@2x', '20', '20@2x', '20@3x', '1024'],
  iOSSizeArray = [120, 180, 76, 152, 40, 80, 120, 29, 58, 87, 167, 20, 40, 60, 1024],
  iOSBaseArray = [60, 60, 76, 76, 40, 40, 40, 29, 29, 29, 83.5, 20, 20, 20, 1024]

function exportScaleLayer (layer, dir, width, suffix) {
  var frame = [layer frame]
  var scale = width / [frame width]

  log(scale)

  if (typeof suffix === 'undefined') {
    var name = layer.name() + '.png'
    path = dir + '/' + name.toLowerCase()
    exportLayerToPath(layer, path, scale, 'png')
  } else {
    var name2 = layer.name() + '-' + suffix + '.png'
    path = dir + '/' + name2

    exportLayerToPath(layer, path, scale, 'png', '-' + suffix)
  }

  return name2

}

function checkExportDir (path, suffix) {
  if (typeof path === 'undefined') {
    path = '~/Downloads'
  }

  if (!path.endsWith('/' + suffix)) {
    createFolderAtPath(path)
    path += '/' + suffix
  }

  var fileManager = [NSFileManager defaultManager]
  if ([fileManager fileExistsAtPath:path]) {
    [fileManager removeItemAtPath:path error:nil]

  }

  [fileManager createDirectoryAtPath:path withIntermediateDirectories:true attributes:nil error:nil]


  appIconSetPath = path
}

function findImage (imagesArray, filename) {
  for (var i = 0; i < imagesArray.length; i++) {
    var imageObj = imagesArray[i]
    if (imageObj.filename === filename) {
      return true
    }
  }

  return false
}

function addIconContent (imagesArray, name, suffix, isIpad) {
  var index = -1
  var scale = '1x'

  for (var i = 0; i < iOSSuffixArray.length; i++) {
    if (iOSSuffixArray[i] === suffix) {
      index = i
      break
    }
  }

  if (index === -1) {
    return
  }

  var baseSize = iOSBaseArray[index]
  var sizeStr = baseSize.toString() + 'x' + baseSize.toString()

  if (suffix.endsWith('@2x'))
    scale = '2x'
  else if (suffix.endsWith('@3x'))
    scale = '3x'

  var device = (isIpad ? 'ipad' : 'iphone')
  var filename = name + '-' + suffix + '.png'

  if (!findImage(imagesArray, filename)) {
    var size = iOSSizeArray[index]
    log(JSON.stringify([currentLayer, appIconSetPath, size, suffix]))
    exportScaleLayer(currentLayer, appIconSetPath, size, suffix)
  }

  var imageObj = {
    idiom: baseSize === 1024 ? 'ios-marketing' : device,
    size: sizeStr,
    scale: scale,
    filename: filename
  }
  imagesArray.push(imageObj)
}

function exportIOSIcon () {
  checkExportDir(exportPath, 'AppIcon.appiconset')

  var imagesArray = []
  var name = currentLayer.name()

  addIconContent(imagesArray, name, '20', 1)
  addIconContent(imagesArray, name, '20@2x', 1)

  addIconContent(imagesArray, name, 'Small-40', 1)
  addIconContent(imagesArray, name, 'Small-40@2x', 1)

  addIconContent(imagesArray, name, '76', 1)
  addIconContent(imagesArray, name, '76@2x', 1)
  addIconContent(imagesArray, name, '83.5@2x', 1)

  addIconContent(imagesArray, name, 'Small', 1)
  addIconContent(imagesArray, name, 'Small@2x', 1)

  addIconContent(imagesArray, name, '20@2x', 0)
  addIconContent(imagesArray, name, '20@3x', 0)
  addIconContent(imagesArray, name, 'Small', 0)
  addIconContent(imagesArray, name, 'Small@2x', 0)
  addIconContent(imagesArray, name, 'Small@3x', 0)

  addIconContent(imagesArray, name, 'Small-40@2x', 0)
  addIconContent(imagesArray, name, 'Small-40@3x', 0)

  addIconContent(imagesArray, name, '60@2x', 0)
  addIconContent(imagesArray, name, '60@3x', 0)

  addIconContent(imagesArray, name, '1024', 0)

  var imageContent = stringify({
    info: {
      version: 1,
      author: 'tschoffelen'
    },
    images: imagesArray
  }, true)

  writeTextToFile(imageContent, appIconSetPath + '/Contents.json')

  return appIconSetPath
}

handler = function onSetting (context) {
  exportPath = loadValue('xcodeProjectPath')
  parseContext(context)

  var selection = context.selection

  if (selection.count() < 1) {
    doc.showMessage('Please select a artboard or layer first.')
    return
  }
  currentLayer = selection.firstObject()

  var accessory = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 25))

  var xcodeInput = NSTextField.alloc().initWithFrame(NSMakeRect(0, 0, 300, 25))
  xcodeInput.stringValue = exportPath
  xcodeInput.editable = true
  xcodeInput.placeholder = 'Drop you project or workspace file to here'

  accessory.addSubview(xcodeInput)

  var alert = NSAlert.alloc().init()
  alert.setMessageText('Select destination')
  alert.addButtonWithTitle('Export')
  alert.addButtonWithTitle('Cancel')
  alert.setIcon(NSImage.alloc().initWithContentsOfFile(context.plugin.urlForResourceNamed('logo.png').path()))
  alert.setAccessoryView(accessory)

  var responseCode = alert.runModal()
  if (responseCode !== 1000) {
    return
  }

  exportPath = xcodeInput.stringValue()
  saveValue('xcodeProjectPath', xcodeInput.stringValue())

  exportIOSIcon()
  doc.showMessage('App icon exported succesfully!')
}


