var server = self.location.host;
var socket = io.connect('http://' + server);
var instruments;

socket.on('connect', getInstruments);

window.onhashchange = getInstruments;

socket.on('reconnecting', function () {
    $.mobile.loading('show', { text: 'finding fluid', textVisible: true });
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
            console.log(e)
            if (e.innerHTML === instruments.currentSoundfont)
                $(e).addClass('ui-btn-active');
        });

        $.mobile.loading('hide');
    });
}
$(document).on('vclick', '#instruments li a', e => {
    e.preventDefault()
    const target = $(e.target.parentElement)
    var index = $(target).attr('data-inum');
    var iname = $(target).text();
    socket.emit('changeinst', index);

    console.log('click ' + iname);
    console.log(target)
    $('#instruments li a').removeClass('ui-btn-active');
    $(e.target).addClass('ui-btn-active');
});
