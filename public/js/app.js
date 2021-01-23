var server = self.location.host;
var socket = io.connect('http://' + server);
var instruments;

socket.on('connect', getInstruments);

window.onhashchange = getInstruments;

socket.on('reconnecting', function () {
    $.mobile.loading('show', { text: 'finding fluid', textVisible: true });
})

socket.on("log", message => {
    console.log(message)
    const text = ($("#logstream").text() || "") + message + '\n'
    $("#logstream").text(text)
    if (message.includes('load soundfonts')) {
        // loading spinner on
        $.mobile.loading('show', { text: 'loading soundfont', textVisible: true });

    }
    if (message.includes('loaded SoundFont has ID')) {
        // loading spinner off        
        $.mobile.loading('hide');
    }
})

function getChannels() {
    socket.emit('getinstruments');
    socket.on('current', function (data) {
        instruments = data.channels;
        console.log(instruments);
    });
}

function getInstruments() {
    $.mobile.loading('show', { text: 'pouring fluid', textVisible: true });
    socket.emit('status', 'client connected');
    socket.emit('getinstruments');

    socket.on('instrumentdump', function (instruments = []) {
        console.log('instruments', instruments)
        $('#instruments').html("");
        $("#instruments").listview();
        instruments.fonts.forEach((instrument, index) => {
            $('#instruments').append(
                `<li data-icon="audio" data-inum="${index}">
        <a href="#">${instrument}</a>
</li>`).enhanceWithin();
        })
        $("#instruments").listview("refresh");
        $('#instruments li a').removeClass('ui-btn-active');
        $('#instruments li a').each((_, e) => {
            if (e.innerHTML === instruments.currentSoundfont) {
                $(e).addClass('ui-btn-active');
            }
        });

        $.mobile.loading('hide');
    });
}

$("#logs").panel();
$(document).on('vclick', '#viewlogs', e => {
    $("#logs").panel("open", {});
})
$(document).on('vclick', '#clearlogs', e => {
    $("#logstream").text("")
})
$(document).on('vclick', '#restart', e => {
    if (window.confirm('Restart Fluidsynth?')) {
        console.log('Sending restart command...')
        socket.emit('restart_fluidsynth', true)
    }
})
$(document).on('vclick', '#shutdown', e => {
    if (window.confirm('Shutdown computer?')) {
        console.log('Sending shutdown command...')
        socket.emit('shutdown', true)
    }
})
$(document).on('vclick', '#instruments li a', e => {
    e.preventDefault()
    const target = $(e.target.parentElement)
    var index = $(target).attr('data-inum');
    // $(target).buttonMarkup({ icon: 'recycle' });
    $("#instruments").listview("refresh");

    socket.emit('changeinst', index);

    $('#instruments li a').removeClass('ui-btn-active');
    $(e.target).addClass('ui-btn-active');
});
