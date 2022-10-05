const GOOGLE_API_KEY = '' // Insert your API key here

const inputEl = document.getElementById('input-el')
const calcBtn = document.getElementById('calc-btn')
const resEl = document.getElementById('result')

calcBtn.addEventListener('click', handleClick)

function parseDuration(PT) {
    var output = [];
    var durationInSec = 0;
    var matches = PT.match(/P(?:(\d*)Y)?(?:(\d*)M)?(?:(\d*)W)?(?:(\d*)D)?T?(?:(\d*)H)?(?:(\d*)M)?(?:(\d*)S)?/i);
    var parts = [
        { // years
            pos: 1,
            multiplier: 86400 * 365
        },
        { // months
            pos: 2,
            multiplier: 86400 * 30
        },
        { // weeks
            pos: 3,
            multiplier: 604800
        },
        { // days
            pos: 4,
            multiplier: 86400
        },
        { // hours
            pos: 5,
            multiplier: 3600
        },
        { // minutes
            pos: 6,
            multiplier: 60
        },
        { // seconds
            pos: 7,
            multiplier: 1
        }
    ];

    for (var i = 0; i < parts.length; i++) {
        if (typeof matches[parts[i].pos] != 'undefined') {
            durationInSec += parseInt(matches[parts[i].pos]) * parts[i].multiplier;
        }
    }
    return durationInSec
}

async function handleClick() {
    try {
        resEl.innerHTML = ''
        resEl.className = 'loader'
        const playlistLink = inputEl.value
        if (!playlistLink.startsWith('https://www.youtube.com/playlist?list=')) {
            throw new Error('invalid url')
        }
        const playlistId = playlistLink.replace('https://www.youtube.com/playlist?list=', '')
        let nextPageToken = ''
        let totalSecs = 0
        while (nextPageToken != null) {
            let uri = `https://youtube.googleapis.com/youtube/v3/playlistItems?fields=nextPageToken,items(contentDetails/videoId)&part=contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${GOOGLE_API_KEY}`
            let response = await fetch(uri)
            let data = await response.json()
            nextPageToken = data.nextPageToken
            if (data.items.length > 0) {
                const videoIds = data.items.map(x => x.contentDetails.videoId)
                const videoIdsCSV = videoIds.join('%2C')
                uri = `https://youtube.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIdsCSV}&maxResults=50&fields=items(contentDetails%2Fduration)&key=${GOOGLE_API_KEY}`
                response = await fetch(uri)
                data = await response.json()
                if (data.items.length > 0) {
                    const durations = data.items.map(x => {
                        const dur = parseDuration(x.contentDetails.duration)
                        return dur
                    })

                    durations.forEach(x => totalSecs += x)

                }
            } else {
                throw new Error('invalid url')
            }
        }
        const duration = moment.duration(totalSecs, 'seconds')
        const playlistDuration = duration.format(duration.days() == 1 ? "d [day] hh:mm:ss" : "d [days] hh:mm:ss")
        resEl.className = ''
        resEl.innerHTML = `${playlistDuration}`
    } catch (error) {
        resEl.className = ''
        if (error.toString().includes('invalid url')) {
            resEl.innerHTML = `invalid url!`
        } else {
            resEl.innerHTML = 'Something went wrong!'
        }
        console.log(error)
    }
}