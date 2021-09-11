let waves;
let res;
let prop;
let screen;
let waveOffset;
let jet;
let drag;
let halt;
let meteors;
let nOff;
let fireOffset;
let health;
let dec;
let tossAngle;
let curLevel;
let score;
let fireLines;
let ind;
let bg;
let cond;
let scoreFilter;
let oceanFloor;

function preload(){
    //theme song
    song = loadSound('./sound/LifeIsMusic.mp3');
    //misc sound files loading
    jetmotor = loadSound('./sound/jet-water.mp3');
    splash = loadSound('./sound/splash.mp3');
    //Cover Image
    cover = loadImage('./images/JetSkii.png');
    //cloudy background
    backgr = loadImage('./images/Background.png');
    //ocean background
    ocean = loadImage('./images/Ocean.png');
    //Jet (main object)
    rider = loadImage('./images/jet.gif');
    //fonts
    bcr = loadFont('./assets/BalooChettan-Regular.ttf');
    sso = loadFont('./assets/SonsieOne-Regular.ttf');
    sbl = loadFont('./assets/Schoolbell-Regular.ttf');
}

function setup(){

    //setting default frameRate
    frameRate(50);

    // game resolution
    res = 20;

    //set screen status
    /*
    1 : START
    2 : CONTROLS
    3 : HEADSTART
    4 : PLAY
    5 : PAUSE
    6 : OVER
    */
    screen=1;

    //getting best window width/height size
    let winSize = window.innerWidth;
    if (window.innerHeight < winSize)
        winSize = window.innerHeight;
    winSize = int(winSize/res) * res;

    //setting canvas size
    createCanvas(winSize, winSize);

    //global parameter-type setting
    angleMode(DEGREES);
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);

    //sound mode setting
    song.playMode('restart');
    jetmotor.playMode('restart');
    splash.playMode('sustain');
    //sounds paused by default
    song.stop();
    jetmotor.setVolume(1);
    jetmotor.pause();
    splash.setVolume(0.3);
    splash.stop();

    //setting game properties
    prop = {
        elev : height * 3 / 4,  //waves' height in general
        tide : height / 12,     //tide's height
        wavesp : 1,             //wave's speed
        numMeteors : 1,         //number of meteors
        meteorSpeed : width / 120,  //speed of all meteors
        slant : -35,
        meteorSize: 5,
    };

    waveOffset=0;
    //wave ripples initialization
    waves=[];
    for (let i = 0; i <= width; i += res) {
        waves.push(prop.elev - noise(waveOffset) * prop.tide);
        waveOffset += res / 200;
    }

    curLevel = 0;
    score = 0;
    scoreFilter = 0;

    jet = {
        width: 15 * (width / 60), //15:9
        height: 9 * (width / 60), //15:9
        speed: width / 60,
    };
    jet.x = - jet.width / 2;
    jet.y = prop.elev - prop.tide / 2;
    rider.pause();
    rider.setFrame(0);
    rider.delay(100);

    drag = 0;

    halt = {
        play: {
            s: height * width / 200 / 20,
        },
        pause: {
            s: width / 15,
            y: height / 20,
        }
    };
    halt.pause.x = width * 19 / 20 - halt.pause.s,

    nOff = 0;
    fireOffset = 0;

    ind=0;
    updateFire(prop.meteorSize, prop.slant);

    meteors = [];
    for (let i = 0; i < prop.numMeteors; i++)
        addMeteor(i, prop.meteorSize, prop.meteorSpeed);

    health = 100;
    dec = 100;

    tossAngle = 0;

    bg = 0;

    oceanFloor = [];
    //ocean floor
    if(pixelDensity() > 1){
        const surf = color(50, 157, 202, 200);
        const flor = color(32, 100, 129, 255);//floor color
        for (let i = prop.elev,inc = res / 2; i <= height; i += inc) {
            oceanFloor.push({
                col : lerpColor(surf, flor, map(i, prop.elev, height, 0, 1)),
                val : i,
            });
        }
    }
}

function draw() {

    if(!focused && screen == 4){
        screen = 5;
        noLoop();
    }

    //JET MOVEMENT/CONTROLS
    if(screen==4){
        let move = jet.speed;
        let boundary={
            left : ceil(jet.width / 2),
            right : floor(width - jet.width / 2),
        };
        //Mouse Control
        if (drag != 0) {
            move = constrain(mouseX - drag, boundary.left, boundary.right);
            jet.x = lerp(jet.x, move, 0.2);
        }
        //Keyboard Control
        if (keyIsDown(LEFT_ARROW))
            jet.x = constrain(jet.x - move, boundary.left, boundary.right);
        else if (keyIsDown(RIGHT_ARROW))
            jet.x = constrain(jet.x + move, boundary.left, boundary.right);
    }
    //tossing the rider onto the ocean when game is over
    else if(screen == 6 && jet.x > -jet.width/2){
        drag = 0;
        jet.x -= res / 1.5;
        jet.y = lerp(jet.y, height, 0.05);
    }
    
    //Background
    background(backgr);

    //WAVE UPDATION
    if(screen == 3 || screen == 4 || screen == 6)
        updateWave(prop, waves);

    for(let i = 0; i < prop.numMeteors; i++){
        let m = meteors[i];
        //CRASH
        if(!m.c && (m.y + m.r) > (jet.y - jet.height / 2) && (m.y - m.r) < (jet.y + jet.height / 2) && abs(m.x - jet.x) < (m.r + jet.width / 2))
            dec = crashCheck(m, jet, dec);

        //METEORS
        if (screen == 4 || screen == 6 || screen == 5){
            const val = res * prop.meteorSize * ((pixelDensity() > 1)?2:1) / 25;
            if (screen != 5)
                ind = displayMeteor(m, val, prop.elev, fireLines, ind);
            else
                displayMeteor(m, val, prop.elev, fireLines, ind);

            if (meteors.length < prop.numMeteors)
                addMeteor(0, prop.meteorSize, prop.meteorSpeed);
            if (screen != 5 && screen != 2)
                updateMeteor(i, prop);
        }
    }

    //JET UPDATION AND DISPLAY
    if((screen == 6 && jet.x >= -jet.width/2) || screen == 4 || screen == 5 || screen==3)
        tossAngle = displayJet(jet, slideJet(jet, prop.tide, waves), waves, tossAngle);

    //WAVE
    createWave(waves, prop.elev);

    if (screen == 3) {
        let h = height/8;
        push();
        rectMode(CORNERS);
        if(jet.x > width/4)
            h = map(jet.x, width/4, width/2, height/8, 0);
        fill(0);
        rect(0, 0, width, h);
        rect(0, height - h, width, height);
        pop();
    } else {
        //To Various SCREEN States
        bg = showState(screen, halt, bg);
        if (screen==4 || screen==5) {
            //SCORE
            const r = showScore(score, curLevel, prop);
            score = r[0];
            curLevel = r[1];
            //HEALTH
            health = showHealthBar(health, tossAngle);
        }
    }
}

function mouseDragged() {
    cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (cond && drag == 0 && screen==4)
        drag = mouseX - jet.x;
}

function mouseReleased() {
    drag = 0;
}

function mousePressed() {
    const replay = bcr.textBounds("PLAY", width/2, height*21/30, height/4);
    const cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (mouseX > halt.pause.x && mouseX < halt.pause.x + halt.pause.s && mouseY > halt.pause.y && mouseY < halt.pause.y + halt.pause.s && screen == 4) {
        screen = 5;
        jetmotor.pause();
        splash.pause();
        noLoop();
    } else if (mouseX > halt.pause.x && mouseX < halt.pause.x + halt.pause.s && mouseY > halt.pause.y && mouseY < halt.pause.y + halt.pause.s && (screen == 5 || screen == 2)) {
        if(song.isLooping() || song.isPlaying()){
            song.pause();
            jetmotor.pause();
            splash.pause();
        }
        else
            song.loop();
        scoreFilter += 2;
        redraw();
    } else if(abs(mouseX - width/2) < halt.play.s/2 && abs(mouseY - height/2) < halt.play.s/2 && screen == 5){
        screen = 4;
        if (song.isLooping() || song.isPlaying())
            jetmotor.loop();
        loop();
    } else if(cond && screen==1){
        screen = 2;
        //single demo meteor initialization
        const temp = [];
        for(let i = 0; i < 360; i += res){
            const cons = 20 * (1 + noise(nOff) / 2); //Rock Disfiguration
            temp.push({
                x : cons * cos(i),
                y : cons * sin(i),
            });
            nOff++;
        }
        //single demo meteor addition
        meteors.splice(0, 0, {
            x: width*7/10,
            y: height*3/10,
            r: 20,
            c: false,
            d: false,
            pts : temp,
            ang : 360,
            sp : 0,
        });
        bg = 130;
        jet.x = int(waves.length/2)*res;
        jet.y = waves[jet.x/res] - prop.tide/2;
        redraw();
    } else if (screen == 2 && mouseX >= halt.pause.x - bcr.textBounds("Skip ",0,0,height/12).w && mouseX <= halt.pause.x + halt.pause.s && mouseY >= halt.pause.y*18 && mouseY <= halt.pause.y*18 + halt.pause.s) {
        screen = 3;
        bg = 0;
        jet.x = -jet.width/2;
        jet.y = prop.elev - prop.tide/2;
        meteors.splice(0, 1);
        if (song.isLooping() || song.isPlaying())
            jetmotor.loop();
        loop();
    } else if(cond && screen == 2){
        ++bg;
        scoreFilter += 2;
        redraw();
    } else if(bg == 150 && screen == 6 && mouseX >= halt.pause.x - bcr.textBounds("Share  ",0,0,height/12).w && mouseX <= halt.pause.x + halt.pause.s && mouseY >= halt.pause.y*18 && mouseY <= halt.pause.y*18 + halt.pause.s){
        screen = 1;
        noLoop();
        redraw();
        document.querySelector('canvas#defaultCanvas0').toBlob(async (blob)=>{
            if (navigator.canShare) {
                await navigator.share({
                    files: [new File([blob], 'JetSkii.jpeg', {type:'image/jpeg'})],
                    title: 'My Score',
                    text: 'Beat my Score !',
                    url: 'https://ahmedazhar05.github.io/JetSkii',
                })
                .then(loop(), loop());
            } else {
              const file = loadImage(URL.createObjectURL(blob), (file)=>{file.save('JetSkii','jpeg');loop()});
            }
        },'image/jpeg',0.5);
        screen = 6;
    } else if(bg == 150 && screen == 6 && mouseX >= replay.x && mouseX <= replay.x + replay.w && mouseY >= replay.y + height/10 && mouseY <= replay.y + height/10 + replay.h)
        setup();
    else if(bg == 150 && screen == 6 && mouseX >= width/20 && mouseX <= width/20 + bcr.textBounds("Credits", 0, 0, height/12).w && mouseY >= halt.pause.y*18 && mouseY <= halt.pause.y*18 + halt.pause.s)
        bg = 151;
    else if(bg == 151 && screen == 6 && cond)
        bg = 150;
    return false;
}

function keyPressed() {
    if (key === ' ') {
        if (screen == 4) {
            screen = 5;
            jetmotor.pause();
            noLoop();
        } else if (screen == 5) {
            screen = 4;
            if (song.isLooping() || song.isPlaying())
                jetmotor.loop();
            loop();
        } else if (screen == 1) {
            screen = 2;
            //single demo meteor initialization
            const temp = [];
            for(let i = 0; i < 360; i += res){
                const cons = 20 * (1 + noise(nOff) / 2); //Rock Disfiguration
                temp.push({
                    x : cons * cos(i),
                    y : cons * sin(i),
                });
                nOff++;
            }
            //single demo meteor addition
            meteors.splice(0, 0, {
                x: width*7/10,
                y: height*3/10,
                r: 20,
                c: false,
                d: false,
                pts : temp,
                ang : 360,
                sp : 0,
            });
            bg = 130;
            jet.x = int(waves.length/2)*res;
            jet.y = waves[jet.x/res] - prop.tide/2;
            redraw();
        } else if(screen == 2){
            ++bg;
            scoreFilter += 2;
            redraw();
        } else if (screen == 6 && bg == 151)
                bg = 150;
        else if (screen == 6 && bg == 150)
            setup();
    } else if (screen == 2 && keyCode == 75) {//key 'K'
        screen = 3;
        bg = 0;
        jet.x = -jet.width/2;
        jet.y = prop.elev - prop.tide/2;
        meteors.splice(0, 1);
        if (song.isLooping() || song.isPlaying())
            jetmotor.loop();
        loop();
    } else if (screen == 6 && keyCode == 67)//key 'C'
        bg = 151;
    else if ((screen == 4 || screen == 5 || screen == 3) && keyCode == 83){//key 'S'
        if(song.isLooping() || song.isPlaying()){
            song.pause();
            jetmotor.pause();
            splash.pause();
        }
        else{
            song.loop();
            jetmotor.loop();
        }
        if (screen == 5){
            scoreFilter += 2;
            redraw();
        }
    } else if (screen == 6 && bg == 150 && keyCode == 69){//key 'E'
        screen = 1;
        noLoop();
        redraw();
        document.querySelector('canvas#defaultCanvas0').toBlob(async (blob)=>{
            if (navigator.canShare) {
                await navigator.share({
                    files: [new File([blob], 'JetSkii.jpeg', {type:'image/jpeg'})],
                    title: 'My Score',
                    text: 'Beat my Score !',
                    url: 'https://ahmedazhar05.github.io/JetSkii',
                })
                .then(loop(), loop());
            } else{
              const file = loadImage(URL.createObjectURL(blob), (file)=>{file.save('JetSkii','jpeg'); loop()});
            }
        },'image/jpeg',0.5);
        screen = 6;
    }
}

function slideJet(j, td, wv) {
    let wp;
    if (screen==3){
        j.x = j.x + res / 10;
        wp = abs(floor(j.x / res));
        j.y = wv[wp] - td / 2;
        if(j.x >= width / 2){
            screen=4;
            scoreFilter = frameCount;
        }
    } else {
        wp = floor(j.x / res);
        if(screen == 4){
        //for smooth bounce
            const newY = wv[wp] - td/2;
            let amt = 0.99;
            if (j.y < newY)
                amt = 0.1;
            j.y = lerp(j.y, newY, amt);
        }
    }
    return wp;
}

function displayJet(j, pt, wv, tA) {
    push();
    translate(j.x, j.y);
    if(screen == 4 || screen == 5 || screen==3){
        const inc = floor(j.width / res / 2) - 1;
        const dy = wv[pt + inc] - wv[pt - inc];
        const dx = res * inc * 2;
        const angle = atan(dy/dx);
        rotate(angle);
    } else if (screen == 6){
        rotate(tA);
        tA -= 10;
    }
    if(rider.getCurrentFrame() == rider.numFrames()-1){
        rider.pause();
        rider.setFrame(0);
    }
    image(rider, -j.width / 2, -j.height / 2, j.width, j.height); //jet
    pop();
    return tA;
}

function crashCheck(m, j, d) {

    const x1 = 0;
    const y1 = j.height;
    const x2 = j.width;
    const y2 = j.height * 5.75 / 9;
    const x3 = j.width * 4.74 / 15;
    const y3 = 0;

    //slopes
    const m1 = (y2 - y3) / (x2 - x3); //slope1
    const m2 = (y3 - y1) / (x3 - x1); //slope2

    //y-intercepts
    const c1 = (y3 + j.y - y1 / 2) - m1 * (x3 + j.x - x2 / 2); //y-intercept1
    const c2 = (y1 + j.y - y1 / 2) - m2 * (x1 + j.x - x2 / 2); //y-intercept2

    //perpendicular distance
    const d1 = abs(-m1 * m.x + m.y - c1) / sqrt((m1 * m1) + 1);
    const d2 = abs(-m2 * m.x + m.y - c2) / sqrt((m2 * m2) + 1);

    //If crashed i.e. crash boundary crossed
    if ((m.x <= (j.x - x2 / 2 + x3) && d2 < m.r / 2) || (m.x > (j.x - x2 / 2 + x3) && d1 < m.r / 2)) {
        //damage = 0;
        m.c = true;
        rider.play();
        return constrain(d - m.r, 0, 100);
    }
    return d;
}

function updateFire(size, sl){
    fireLines = [];
    const rad = width * size / 187.5;
    for(let i = 0; i < width * size / 75; i++){
        const len =  rad * 2 * (1 + noise(fireOffset));
        fireLines.push({
            col : color(255, (random() > 0.4)?175:75, 0),
            x : len * cos(90 + sl),
            y : len * sin(90 + sl),
        });
        fireOffset++;
    }
}

function addMeteor(index, size, speed) {
    const rad=floor(random(width * size / 250, width * size / 150));
    const temp = [];
    for(let i = 0; i < 360; i += res){
        const cons = rad * (1 + noise(nOff) / 2); //Rock Disfiguration
        temp.push({
            x : cons * cos(i),
            y : cons * sin(i),
        });
        nOff++;
    }
    meteors.splice(index, 0, {
        x: random(height + rad / 2, 2 * width - rad / 2),
        y: random(-(height - rad / 2), -rad / 2),
        r: rad,
        c: false,
        d: false,
        pts : temp,
        ang : 360,
        sp : (curLevel > 4)?speed:random(speed, speed * 1.25),
    });
}

function displayMeteor(m, val, el, fire, ind){
    push();
    translate(m.x, m.y);
    strokeWeight(val);
    let p;
    for(let i = -m.r / sqrt(2), l = -i, inc = val/1.4; i <= l && m.y < el; i += inc){
        p = fire[ind];
        stroke(p.col);
        line(i, i, i + p.x , i - p.y);
        ind = (ind+1)%fire.length;
    }
    beginShape();
    stroke(255, (nOff % 100) + 75, 0);
    fill(139, 69, 19);//brown color
    rotate(m.ang);                          //REMOVE ROTATION
    for(let i = 0; i < m.pts.length; i++)
        vertex(m.pts[i].x, m.pts[i].y);
    endShape(CLOSE);
    if(screen != 5 && screen != 2)
        m.ang -= (m.ang)?20:-360;
    pop();
    return ind;
}

function updateMeteor(index, p){
    const m = meteors[index];
    //Shifting Meteors
    m.x -= m.sp;
    m.y += m.sp;

    if(m.y > p.elev && !m.d && m.x > 0 && m.x < width){
        const waveHeight = m.r * 1.25;
        let low = floor((m.x - waveHeight * 5)/res);
        let upp = ceil((m.x + waveHeight * 4)/res);
        low = (low < 0)?0:low;
        upp = (upp >= waves.length)?waves.length-1:upp;
        //elevating/rising/creating waves (cosine wave of 2pi radians)
        for(let j = low; j <= upp; j++)
            waves[j] -= waveHeight * (1 - cos(map(j, low, upp, 0, 360)));
        m.d = true;
        if ((song.isPlaying() || song.isLooping()) && screen != 6)
            splash.play();
    }

    //create new ones when a meteor drowns or goes out of the visible area
    if((m.y - m.r) > (p.elev + p.tide * 1.5) || (m.x + m.r) < 0){
        meteors.splice(index, 1);
        if (meteors.length < prop.numMeteors)
            addMeteor(index, p.meteorSize, p.meteorSpeed);
    }
}

function createWave(wv, el) {
    noStroke();
    //fill(151, 221, 223, 200);
    fill(50,157,202, 200);

    //displaying surface waves pattern
    beginShape();
    vertex(0, el);
    for(let i = 0; i < wv.length; i++)
        vertex(i * res, wv[i]);
    vertex(width, el);
    endShape(CLOSE);

    if (!oceanFloor.length)
        image(ocean, 0, el, width, height - el);
    else {
        for (let i = 0, inc = res / 2; i < oceanFloor.length; i++) {
            fill(oceanFloor[i].col);
            rect(0, oceanFloor[i].val, width, inc);
        }
    }
}

function updateWave(p, wv){
    //Wave Shifting
    for (let i = 0; i <= p.wavesp; i += res) {
        //wave particle addition at the back/right
        wv.push(p.elev - noise(waveOffset) * p.tide);
        //wave particle removal from the front/left
        wv.shift();
        waveOffset += res / 200;
    }
}

function showState(sc, halt, bg) {
    fill(255, 128, 0);  //orange color
    stroke(0);
    if (sc == 4) {
        //show PAUSE button
        push();
        translate(halt.pause.x, halt.pause.y);
        rect(0, 0, halt.pause.s / 3, halt.pause.s);
        rect(halt.pause.s * 2 / 3, 0, halt.pause.s / 3, halt.pause.s);
        pop();
    } else if (sc == 5) {
        //show PLAY button
        push();
        background(0, 200);
        translate((width - halt.play.s)/2 , (height - halt.play.s)/2);
        triangle(0, 0, 0, halt.play.s, halt.play.s, halt.play.s / 2);
        translate(halt.pause.x - (width - halt.play.s)/2, halt.pause.y - (height - halt.play.s)/2);
        let shift;
        noFill();
        strokeWeight(5);
        if(song.isLooping() || song.isPlaying()){
            stroke(0, 255, 0);
            shift = 0;
            arc(halt.pause.s*3/8, halt.pause.s/2, halt.pause.s, halt.pause.s, -45, 45);
            arc(halt.pause.s*3/8, halt.pause.s/2, halt.pause.s/1.5, halt.pause.s/1.5, -45, 45);
            fill(0, 255, 0);
        } else {
            stroke(255, 0, 0);
            shift = halt.pause.s / 4;
            line(shift/2, shift/2, halt.pause.s -shift/4, halt.pause.s -shift/4);
            fill(255, 0, 0);
        }
        noStroke();
        rect(shift, halt.pause.s * 0.3, halt.pause.s * 0.2, halt.pause.s * 0.4);
        triangle(shift, halt.pause.s/2, shift + halt.pause.s * 0.5, 0, shift + halt.pause.s * 0.5, halt.pause.s);
        pop();
    } else if(sc == 2){
        //help rudy reach as far possible as his health deteriorates
        push();
        textAlign(CENTER, CENTER);
        textFont(bcr, height/15).noStroke().fill(255, 175, 0);
        switch(bg){
            case 130:
                background(0, bg);
                text("This is Rudy", width/2, height/2);
                displayJet(jet, jet.x/res, waves, 0);
                break;
            case 131:
                displayJet(jet, jet.x/res, waves, 0);
                background(0, bg);
                displayMeteor(meteors[0], res * 5 * ((pixelDensity() > 1)?2:1) / 25, height*3/4, fireLines, ind);
                text("He needs to dodge Meteors and reach his destination..", width/10, height/10, width/2, height/2);
                textSize(height/20);
                fill(184, 77, 97);
                text("Swipe to speed up\nor to slow down", width/2, height*75/90);
                stroke(255)
                const ctrl = bcr.textBounds("  Swipe to speed up  ", width/2, 0, height/20);
                triangle(width/2 - jet.width*3/4, jet.y - halt.pause.s/2, width/2 - jet.width*3/4, jet.y + halt.pause.s/2, width/2 - jet.width*3/4 - halt.pause.s/2, jet.y);
                triangle(width/2 + jet.width*3/4, jet.y - halt.pause.s/2, width/2 + jet.width*3/4, jet.y + halt.pause.s/2, width/2 + jet.width*3/4 + halt.pause.s/2, jet.y);
                //triangle(width/2 - ctrl.w/2, height*8/10 - halt.pause.s/2, width/2 - ctrl.w/2, height*8/10 + halt.pause.s/2, width/2 - ctrl.w/2 - halt.pause.s/2, height*8/10);
                //triangle(width/2 + ctrl.w/2, height*8/10 - halt.pause.s/2, width/2 + ctrl.w/2, height*8/10 + halt.pause.s/2, width/2 + ctrl.w/2 + halt.pause.s/2, height*8/10);
                break;
            case 132:
                displayJet(jet, jet.x/res, waves, 0);
                displayMeteor(meteors[0], res * 5 * ((pixelDensity() > 1)?2:1) / 25, height*3/4, fireLines, ind);
                background(0, bg);
                text("...before his Health deteriorates.", width/40, height/40, width/2, height/2);
                showHealthBar(100, 0);
                break;
            case 133:
                background(0, bg);
                textSize(height/6);
                text("Lets Go", width/2, height/2);
                break;
            default:
                bg = 0;
                screen = 3;
                if (song.isLooping() || song.isPlaying())
                    jetmotor.loop();
                jet.x = -jet.width/2;
                jet.y = prop.elev - prop.tide/2;
                meteors.splice(0, 1);
                loop();
        }
        //'Skip' Text
        translate(halt.pause.x, halt.pause.y);
        let shift;
        noFill().strokeWeight(5);
        if(song.isLooping() || song.isPlaying()){
            stroke(0, 255, 0);
            shift = 0;
            arc(halt.pause.s*3/8, halt.pause.s/2, halt.pause.s, halt.pause.s, -45, 45);
            arc(halt.pause.s*3/8, halt.pause.s/2, halt.pause.s/1.5, halt.pause.s/1.5, -45, 45);
            fill(0, 255, 0);
        } else {
            stroke(255, 0, 0);
            shift = halt.pause.s / 4;
            line(shift/2, shift/2, halt.pause.s -shift/4, halt.pause.s -shift/4);
            fill(255, 0, 0);
        }
        noStroke();
        rect(shift, halt.pause.s * 0.3, halt.pause.s * 0.2, halt.pause.s * 0.4);
        triangle(shift, halt.pause.s/2, shift + halt.pause.s * 0.5, 0, shift + halt.pause.s * 0.5, halt.pause.s);
        noStroke();
        const skipBox = bcr.textBounds("Skip  ", 0, 0, height/12);
        translate(0, halt.pause.y*17);
        textFont(bcr, height/12);
        fill(33, 128, 124);//dark green
        text("Skip", -skipBox.w/2, skipBox.h/4);
        //Skip Icon at bottom right corner
        rect(halt.pause.s*3/4, 0, halt.pause.s/4, halt.pause.s);
        triangle(0, 0, halt.pause.s*0.625, halt.pause.s/2, 0, halt.pause.s);
        pop();
    } else if (sc == 6 && jet.x < -jet.width/2) {//GAME OVER SCREEN
        background(255, bg);
        if(bg >= 135 && bg < 151){
            bg = 150;
            push();
            textAlign(CENTER, CENTER);
            //Content
            textFont(sbl, height/15).fill(0);
            text("\nRUDY DROWNED !",width/2, height/3);
            //Score
            textFont(sso, height/9).fill(50, 157, 202).noStroke();//fill(0, 161, 211);
            text("score",width/3, height*19/36);
            textFont(bcr, height/5).fill(255, 175, 0).stroke(255, 100, 0).strokeWeight(5);///*yellow*/.noStroke();//.stroke(255, 75, 0)/*orange*/.strokeWeight(10);
            text(score, width*3/4, height/2);
            //Play Button
            fill(184, 62, 98).noStroke();
            text("PLAY", width/2, height*21/30);
            //Game Title
            textFont(sso, height/6).strokeWeight(10);//.fill(184, 77, 97)/*pinkish red*/.stroke(37,50,85);/*dark blue*/
            fill(20,56,132);//dark blue
            stroke(255,185,0);//yellow
            text("JetSkii",width/2, height/6);
            textAlign(LEFT);
            const shareBox = bcr.textBounds("Share  ", 0, 0, height/12);
            //Play Again
            fill(255).noStroke().textFont(bcr, height/12);
            text("Credits", width/20, halt.pause.y*18 + shareBox.h/4);
            //'Share' Text
            translate(halt.pause.x, halt.pause.y*18);
            fill(33, 128, 124);//dark green
            text("Share", -shareBox.w, shareBox.h/4);
            //Share Icon at bottom right corner
            strokeWeight(10).stroke(33, 128, 124);
            line(halt.pause.s/8, halt.pause.s/2, halt.pause.s*7/8, halt.pause.s/8);
            line(halt.pause.s/8, halt.pause.s/2, halt.pause.s*7/8, halt.pause.s*7/8);
            noStroke();
            circle(halt.pause.s*7/8, halt.pause.s/8, halt.pause.s/2);
            circle(halt.pause.s/8, halt.pause.s/2, halt.pause.s/2);
            circle(halt.pause.s*7/8, halt.pause.s*7/8, halt.pause.s/2);
            pop();
        } else if(bg == 151){
            push();
            //Game Title
            textFont(sso, height/6).strokeWeight(10).fill(20,56,132).stroke(255,185,0);
            text("JetSkii",width/2, height/6);
            noStroke().textFont(bcr, height/22);
            fill(33, 128, 124);
            textAlign(LEFT);
            text("Created By\n\nJavascript\nLibrary\nMusic\n\nLogo Font\nSpecial\nthanks to\n\n",width/8, height*2/3);
            fill(184, 62, 98);
            textAlign(RIGHT);
            text("Mohammed\nAzhar Ahmed Nilmadhab Roy\np5js.org\n\n'Life is Music' by\nRudy Mancuso\nSonsie One\nDaniel\nShiffman from\nthecodingtrain.com\n",width*7/8, height*2/3);
            pop();
        } else
            bg = lerp(bg, 150, 0.05);
    } else if (sc == 1) {
        //START Screen Background
        push();
        if(bg == 0)
            background(cover);
        else
            background(255, bg);
        textFont(sso, height/6).strokeWeight(10);//.fill(184,77,97)/*pinkish red*/.stroke(37,50,85);//dark blue
        fill(20,56,132);//dark blue
        stroke(255,185,0);//yellow
        text("JetSkii",width/2, height/6);
        if(bg == 0)
            noLoop();
        else {
            noStroke();
            textAlign(CENTER, CENTER);
            //Content
            textFont(sbl, height/15).fill(0);
            text("\nRUDY DROWNED !",width/2, height/3);
            //Score
            textFont(sso, height/10).fill(50, 157, 202).noStroke();
            text("score",width/2, height/2);
            textFont(bcr, height/3).fill(255, 175, 0).stroke(/*255, 100, 0*/255, 70, 0).strokeWeight(15);
            text(score, width/2, height*2/3);
        }
        pop();
    }
    return bg;
    //use switch case instead of if-else after replacing screen values with numbers
}

function showScore(sc, lv, p) {
    push();
    textAlign(LEFT, CENTER);
    fill(255, 180, 0).textFont(bcr, height/15).noStroke();//.textSize(height* 5 / 76);
    text('Score : ' + sc, width / 20, height * 18 / 20);
    sc = round((frameCount - scoreFilter) / 50);
    if(sc != 0 && sc % 10 === 0 && floor(sc/10) > lv-1)
        levelChange(++lv, p);
    pop();
    return [sc,lv];
}

function showHealthBar(hl, tA) {
    stroke(0);
    fill(255);
    const h = height/30;
    const w = width/3;
    rect(h, h, w, h);
    hl = lerp(hl, dec, 0.2);
    fill((100 - hl)*255/100, hl*255/100, 0).noStroke();
    rect(h, h, map(hl, 0, 100, 0, w), h);
    fill(255).strokeWeight(3).stroke(0).textFont(bcr, h);
    text("HEALTH", h + w / 2, h + height / 100);
    if(hl <= 0.5 && screen != 6) {
        screen = 6;
        jetmotor.stop();
        if (pixelDensity() > 1)
            prop.numMeteors = 1;
        tA = 0;
    }
    strokeWeight(1);
    return hl;
}

function levelChange(lev, p, fire){
    switch(lev){
        case 1:
            break;
        case 2:
            p.numMeteors += 1;
            break;
        case 3:
            p.meteorSpeed = width / 100;
            p.wavesp += 2;
            break;
        case 4:
            p.meteorSize += 1;
            updateFire(p.meteorSize, p.slant);
            break;
        case 5:
            //random meteor speeds
            break;
        case 6:
            p.meteorSpeed = width / 80;
            p.wavesp += 4;
            p.slant -= 3;
            break;
        case 7:
            p.numMeteors += 1;
            break;
        case 8:
            p.meteorSpeed = width / 60;
            p.wavesp += 4;
            p.slant -= 2;
            break;
        case 9:
            p.meteorSize += 1;
            updateFire(p.meteorSize, p.slant);
            break;
        case 10:
            p.numMeteors += 1;
            break;
    }
}

//correction of 'splash' Sound
//remove demo meteor updation
//adding cache functionality
/*
frequency change for 'jetmotor' sound :-
--if mouseDragged and drag is positive then increase frequency
--if mouseDragged and drag is negative then decrease frequency
similarly,
--if keyIsDown(RIGHT) then increase frequency
--if keyIsDown(LEFT ) then decrease frequency
*/
