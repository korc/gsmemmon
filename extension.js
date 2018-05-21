const St = imports.gi.St;
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

let button;
let buttonLabel;
let statusFile;
let timeoutId;
let tick = 0;

function _reloadShell() {
    global.reexec_self();
}

function init() {
    button = new St.Bin({
        style_class: 'panel-button',
        reactive: true,
        can_focus: true,
        x_fill: true,
        y_fill: false,
        track_hover: true
    });

    // let icon = new St.Icon({ icon_name: 'system-run-symbolic',
    //                          style_class: 'system-status-icon' });

    statusFile = Gio.File.new_for_path('/proc/self/status');
    buttonLabel = new St.Label({ text: "?? MB" });
    // button.set_child(icon);
    button.set_child(buttonLabel);
    button.connect('button-press-event', _reloadShell);
}

let units = [['kb', 1024], ['mb', 1024 * 1024], ['gb', 1024 * 1024 * 1024]];

function normalizeSizeUnits(s) {
    var unitDict = {};
    units.forEach(function (u) { unitDict[u[0]] = u[1]; });
    var m = s.match(/^([0-9]+)(?:\s+(kb|mb|gb))?$/i);
    if (!m) return s;
    var value = parseInt(m[1]);
    if (m[2]) value = value * unitDict[m[2].toLowerCase()];
    var ret = value + " B";
    for (var i = 0; i < units.length; i++) {
        if (value >= units[i][1])
            ret = (Math.round(value * 10 / units[i][1]) / 10) + " " + units[i][0];
    }
    return ret.toUpperCase();
}

function updateLabel() {
    tick += 1;
    let fileInput = statusFile.read(null);
    let data = fileInput.read_bytes(8192, null).get_data();
    let pid = ("" + data).match(/^Pid:\s+([0-9]+)/m)[1];
    let mem = ("" + data).match(/^RssAnon:\s+(.*)$/m)[1];
    buttonLabel.set_text('[' + pid + '] ' + normalizeSizeUnits(mem));
    return true;
}

function enable() {
    Main.panel._rightBox.insert_child_at_index(button, 0);
    updateLabel();
    timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 5000, updateLabel);
}

function disable() {
    Main.panel._rightBox.remove_child(button);
    GLib.Source.remove(timeoutId);
}
