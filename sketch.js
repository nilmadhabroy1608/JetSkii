//JetSkii WaveEdit
let res; //resolution
let prop; //properties
let jetrider;
let wave;
let noiseoffset;
let screen;
let gameBreak;
let drag;
let healthbar;
let hb;
let noiserad;
let tr;
let tintColor;
let jet, sc;
let angY;
let ispx;
let del; //delete score
let song;

function preload() {
    song = loadSound('./sound/TheOcean.mp3');
    jet = loadImage('./images/jet.png');
    sOn = loadImage('./images/soundOn.png');
    sOff = loadImage('./images/soundOff.png');
    tree = loadImage('./images/tree.png');
    //bb = loadFont('./assets/Blinker-Bold.ttf');
    bcr = loadFont('./assets/BalooChettan-Regular.ttf');
}

function setup() {
    iw = window.innerWidth;
    ih = window.innerHeight;
    if (ih < iw)
        iw = ih;
    while (iw % 20) {
        --iw;
    }
    /*if (ih > iw)
        ih = iw;*/
    createCanvas(iw, iw);
    //frameRate(10);
    angleMode(DEGREES);
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);
    textFont(bcr);

    getAudioContext().resume();
    song.playMode('restart');
    song.loop();

    res = 20;
    noff = 0;
    prop = {
        //elev : height*4/5,
        elev: height * 3 / 4, //wave elevation
        tide: height / 12,
    };

    drag = 0;

    jetrider = {
        width: 15 * (width / 60), //15:9
        height: 9 * (width / 60), //15:9
        y: prop.elev,
        speed: width * 8 / 600,
    };
    jetrider.x = -ceil(jetrider.width / 2);
    angY = 0;

    gameBreak = {
        play: {
            size: width / 200,
        }
    };
    gameBreak.play.w = height * gameBreak.play.size / 20;
    gameBreak.play.h = height * gameBreak.play.size / 20;
    gameBreak = {
        play: {
            size: gameBreak.play.size,
            w: gameBreak.play.w,
            h: gameBreak.play.h,
            x: (height - gameBreak.play.w) / 2,
            y: (height - gameBreak.play.h) / 2,
        },
        pause: {
            w: height / 20,
            h: height / 20,
            x: width * 18 / 20,
            y: height / 20,
        }
    };

    ispx = width + 150;

    del = 0;

    //RESET
    reset();
}

function draw() {

    //JET MOVEMENT/CONTROLS
    if (prop.ahead >= (width - jetrider.width) / 2) {
        let move = jetrider.speed;
        //Mouse Control
        if (drag != 0) {
            move = mouseX - drag;
            jetrider.x = constrain(move, ceil(jetrider.width / 2), floor(width - jetrider.width / 2));
        }
        //Keyboard Control
        if (keyIsDown(LEFT_ARROW)) {
            jetrider.x = constrain(jetrider.x - move, ceil(jetrider.width / 2), floor(width - jetrider.width / 2));
        }
        if (keyIsDown(RIGHT_ARROW)) {
            jetrider.x = constrain(jetrider.x + move, ceil(jetrider.width / 2), floor(width - jetrider.width / 2));
        }
    }

    //Sky
    background(222, 235, 247);

    //Background Scene
    //if (screen == 'PLAY')
    backscene();

    //beginning animation
    if (prop.ahead < (width - jetrider.width) / 2 && screen == 'PLAY') {
        prop.ahead += width / 300;
    }

    //METEORS
    if (screen == 'PLAY')
        meteorUpdate();

    //JET
    displayJet();

    //CRASH
    crashCheck();

    //WAVE CREATION
    waveCreation();

    //PLAY/PAUSE BUTTON
    playpause();

    //SCORE
    score();

    if (prop.ahead >= (width - jetrider.width) / 2) {
        //HEALTHBAR
        healthBar();
    }

    //Game START/OVER Screen
    screenUp();

    if (!(frameCount % 1500))
        levelup();
}

function mouseDragged() {
    cond = (mouseX > 0 && mouseX < width) && (mouseY > 0 && mouseY < height);
    if (cond && drag == 0)
        drag = mouseX - jetrider.x;
}

function mouseReleased() {
    drag = 0;
}

function mousePressed() {
    cond = (mouseX > 0 && mouseX < width) && (mouseY > 0 && mouseY < height);
    if ((mouseX > gameBreak.pause.x && mouseX < gameBreak.pause.x + gameBreak.pause.w) && (mouseY > gameBreak.pause.y && mouseY < gameBreak.pause.y + gameBreak.pause.h) && screen == "PLAY") {
        screen = "PAUSE";
        noLoop();
    } else if ((mouseX > gameBreak.play.x && mouseX < gameBreak.play.x + gameBreak.play.w) && (mouseY > gameBreak.play.y && mouseY < gameBreak.play.y + gameBreak.play.h) && screen == "PAUSE") {
        screen = "PLAY";
        loop();
    } else if ((mouseX > gameBreak.pause.x && mouseX < gameBreak.pause.x + gameBreak.pause.w) && (mouseY > gameBreak.pause.y && mouseY < gameBreak.pause.y + gameBreak.pause.h) && screen == "PAUSE") {
        if (song.isPaused())
            song.loop();
        else
            song.pause();
        draw();
    } else if (cond && screen == "OVER") {
        reset();
    } else if (cond && screen == "START") {
        screen = "PLAY";
        loop();
    }
    return false;
}

function keyPressed() {
    if (key === ' ') {
        if (screen == "START") {
            screen = "PLAY";
            loop();
        } else if (screen == "OVER") {
            reset();
        } else if (screen == "PLAY") {
            screen = "PAUSE";
            noLoop();
        } else if (screen == "PAUSE") {
            screen = "PLAY";
            loop();
        }
    } else if (key === 's' || key == 'S') {
        if (song.isPaused())
            song.loop();
        else
            song.pause();
    }

    //FOR DEBUGGING
    if (key >= '1' && key <= '9')
        frameRate(key.valueOf() * 10);
    return false;
}

function reset() {
    screen = "START";
    song.loop();
    prop.numMeteors = 1;
    prop.meteorSpeed = width / 120;
    prop.wavesp = round((width / height) * (res / 4));
    meteors = [];
    for (let i = 0; i < prop.numMeteors; i++) {
        addMeteor(i);
    }
    prop.ahead = -ceil(jetrider.width); //(width - jetrider.width) / 2 - 10;
    noff = 0;
    noiserad = 0;
    wave = [];
    for (let i = 0; i <= width; i += res) {
        wave.push(prop.elev - noise(noff) * prop.tide);
        noff += res / 200;
    }
    healthbar = hb = 100;
    tintColor = 255;
    prop.slant = -35;
    del = frameCount;
}

function screenUp() {
    if (screen == "START" || screen == "OVER") {
        background(220);
        fill(255, 0, 0);
        textSize(width / 8);
        if (screen == "OVER")
            t = 'PEWDS \nDIED \nand MADE\n' + round((frameCount - del) / 60) + '!';
        else if (screen == "START")
            t = 'HELP PEWDS \nDODGE \nMETEORS !';
        text(t, width / 2, height / 2);
        noLoop();
    }
}

function healthBar() {
    stroke(0);
    fill(255);
    healthpos = height / 30;
    hbarlength = width / 3;
    healthbar = lerp(healthbar, hb, 0.2);
    rect(healthpos, healthpos, hbarlength, healthpos);
    fill(255, 0, 0);
    rect(healthpos, healthpos, map(healthbar, 0, 100, 0, hbarlength), healthpos);
    fill(255).textSize(healthpos).strokeWeight(3);
    text(/*"w:" + width + ",re:" + res + ",ws:" + prop.wavesp + ",fr:" + round(frameRate()) /*+ ",h:" + height  */ "H E A L T H" , healthpos + hbarlength / 2, healthpos + height / 100);
    strokeWeight(1);
    if (healthbar <= 1) {
        screen = "OVER";
        noLoop();
        song.stop();
    }
}

function playpause() {
    stroke(0);
    if (screen == "PLAY") {
        //show PAUSE button
        push();
        fill(255, 128, 0);
        translate(gameBreak.pause.x, gameBreak.pause.y);
        rect(0, 0, gameBreak.pause.w / 3, gameBreak.pause.h);
        rect(gameBreak.pause.w * 2 / 3, 0, gameBreak.pause.w / 3, gameBreak.pause.h);
        pop();
    } else if (screen == "PAUSE") {
        //show PLAY button
        push();
        background(0, 200);
        ico = sOn;
        if (song.isPaused())
            ico = sOff;
        image(ico, gameBreak.pause.x-gameBreak.pause.w/2, gameBreak.pause.y, gameBreak.pause.w*1.5, gameBreak.pause.h*1.5);
        fill(255, 128, 0);
        translate(gameBreak.play.x, gameBreak.play.y);
        triangle(0, 0, 0, gameBreak.play.h, gameBreak.play.w, gameBreak.play.h / 2);
        pop();
    }
}

function score() {
    ht = height * 5 / 76;
    wd = ht / 2.20;
    posY = height * 18 / 20;
    posX = width / 20;
    push();
    noStroke();
    textAlign(LEFT, CENTER);
    fill(255, 180, 0).textSize(ht);
    fr = frameCount - del;
    text('Score : ' + round(fr / 60), posX, posY);
    pop();
}

function levelup() {
    if ((frameCount - del) % 3000)
        prop.numMeteors += 1;
    else {
        prop.slant -= 2.5;
        prop.meteorSpeed *= width / 600;
        prop.wavesp += round((width / height) * (res / 4));
    }
}

function crashCheck() {
    for (i = 0; i < prop.numMeteors; i++) {
        if (meteors[i].c)
            continue;
        if ((meteors[i].y + meteors[i].r > jetrider.y - jetrider.height / 2) && (meteors[i].y - meteors[i].r < jetrider.y + jetrider.height / 2)) {
            if (abs(meteors[i].x - jetrider.x) < meteors[i].r + jetrider.width / 2) {

                x1 = 0;
                y1 = jetrider.height;
                x2 = jetrider.width;
                y2 = jetrider.height * 5.75 / 9;
                x3 = jetrider.width * 4.74 / 15;
                y3 = 0;

                //slopes
                m1 = (y2 - y3) / (x2 - x3); //slope1
                m2 = (y3 - y1) / (x3 - x1); //slope2

                //y-intercepts
                c1 = (y3 + jetrider.y - jetrider.height / 2) - m1 * (x3 + jetrider.x - jetrider.width / 2); //y-intercept1
                c2 = (y1 + jetrider.y - jetrider.height / 2) - m2 * (x1 + jetrider.x - jetrider.width / 2); //y-intercept2

                //perpendicular distance
                d1 = abs(-m1 * meteors[i].x + meteors[i].y - c1) / sqrt((m1 * m1) + 1);
                d2 = abs(-m2 * meteors[i].x + meteors[i].y - c2) / sqrt((m2 * m2) + 1);

                if (meteors[i].x <= (jetrider.x - jetrider.width / 2 + jetrider.width * 4.74 / 15) && d2 < meteors[i].r / 2) {
                    tintColor = 0;
                    hb = constrain(hb - meteors[i].r, 0, 100);
                    meteors[i].c = true;
                } else if (meteors[i].x > (jetrider.x - jetrider.width / 2 + jetrider.width * 4.74 / 15) && d1 < meteors[i].r / 2) {
                    tintColor = 0;
                    hb = constrain(hb - meteors[i].r, 0, 100);
                    meteors[i].c = true;
                }
            }
        }
    }
}

function splash(index) {
    let pos = floor(meteors[index].x / res);
    for (let i = -floor(width / 400); i < ceil(width / 400) + 1; i++) {
        if (typeof wave[pos + i] === 'undefined')
            continue;
        wave[pos + i] -= meteors[index].r / 2;
    }
}

function meteorUpdate() {
    if (meteors.length < prop.numMeteors)
        addMeteor();
    else if(meteors.length > prop.numMeteors)
        meteors.splice(0, meteors.length - prop.numMeteors);
    if (prop.ahead >= (width - jetrider.width) / 2) {
        for (let i = 0; i < prop.numMeteors; i++) {
            displayMeteor(meteors[i].x, meteors[i].y, meteors[i].r * 2);
            meteors[i].x -= prop.meteorSpeed /* * tan(90 + prop.slant)*/ ;
            meteors[i].y += prop.meteorSpeed /* * tan(90 + prop.slant)*/ ;
            let lev = meteors[i].y + meteors[i].r - wave[floor(meteors[i].x / res)];
            if (lev > 0 || (meteors[i].x + radius * 2 < 0)) {

                if (lev < meteors[i].r * 2)
                    splash(i);

                if ((meteors[i].x + radius * 2 < 0) || (meteors[i].y - meteors[i].r * 2 > prop.elev + height / 10 /*wave[floor(meteors[i].x / res)]*/ )) {
                    meteors[i].c = true;
                    meteors.splice(i, 1);
                    addMeteor(i);
                }
            }
        }
    }
}

function displayJet() {
    //JET POSITIONING
    if (prop.ahead >= (width - jetrider.width) / 2) {
        let newY = wave[floor(jetrider.x / res)] - prop.tide / 2;
        let amt = 0.99;
        if (jetrider.y < newY)
            amt = 0.1;
        if (screen != 'PLAY')
            amt = 0;
        jetrider.y = lerp(jetrider.y, newY, amt);
    } else {
        jetrider.x = prop.ahead + ceil(jetrider.width / 2);
        jetrider.y = wave[abs(floor(jetrider.x / res))] - prop.tide / 2;
    }

    //Display
    push();
    noStroke();
    translate(jetrider.x, jetrider.y);
    let newAngle = wave[floor((abs(jetrider.x + jetrider.width * 3 / 8)) / res)] - wave[floor((abs(jetrider.x - jetrider.width * 3 / 8)) / res)];
    let amt = 0.99;
    if (newAngle < 0)
        amt = 0.05;
    angY = lerp(angY, newAngle, amt);
    //angY = wave[floor((abs(jetrider.x + jetrider.width * 3 / 8)) / res)] - wave[floor((abs(jetrider.x - jetrider.width * 3 / 8)) / res)];
    rotate(atan((angY * 8) / (6 * jetrider.width)));
    if (tintColor <= 250) {
        tintColor = lerp(tintColor, 255, 0.2); //0.05);
        /*tint(255, healthbar * 255 / 100, healthbar * 255 / 100);*/
        tint(255, tintColor, tintColor);
    }
    image(jet, -jetrider.width / 2, -jetrider.height / 2, jetrider.width, jetrider.height); //jet
    pop();
}

function addMeteor(index) {
    rad = random(width / 40, width / 24);
    meteors.splice(index, 0, {
        x: random(height + rad / 2, 2 * width - rad / 2),
        y: random(-(height - rad / 2), -rad / 2),
        r: floor(rad),
        c: false,
    });
}

function waveCreation() {
    //WAVE CREATION
    c1 = color(0, 128, 255, 200);//surface
    c2 = color(0, 0, 255, 255);//floor
    noStroke();
    fill(c1);
    //stroke(0);
    beginShape();
    vertex(0, prop.elev); //height);
    for (let i = 0; i <= width; i += res) {
        //Waves Surface
        vertex(i, wave[round(i / res)]);
    }
    vertex(width, prop.elev); //height);
    endShape(CLOSE);
    //Ocean Floor
    let inc = res / 2;
    for (let i = prop.elev; i <= height; i += inc) {
        amt = map(i, prop.elev, height, 0, 1);
        lc = lerpColor(c1, c2, amt);
        fill(lc);
        rect(0, i, width, inc);
    }

    //WAVE SHIFTING
    for (let i = 0; i <= prop.wavesp && screen == 'PLAY'; i += res) {
        wave.push(prop.elev - noise(noff) * prop.tide);
        wave.shift();
        noff += res / 200;
    }
}

function displayMeteor(tx, ty, diameter) {
    radius = diameter / 2;
    inc = floor(res / 5);
    push();
    beginShape();
    limit = radius / sqrt(2);
    mradius = radius * 3 / 4;
    for (let i = -radius; i <= radius; i += inc) {
        if (abs(i) <= limit && ty < prop.elev) {
            //FIRELINES
            strokeWeight(1 + inc);
            if (random() > 0.4) //percentage of yellow fire lines appearing
                stroke(255, 175, 0);
            else
                stroke(255, 75, 0);
            n = -radius * 3 * noise(noiserad) + radius * (cos(i * 90 / radius) + 1);
            fx = tx + i;
            fy = ty - tan(prop.slant) * i;
            len = radius * 3 + n;
            line(fx, fy, fx + len * cos(90 + prop.slant), fy - len * sin(90 + prop.slant)); //firelines
        }

        //METEOR ROCK
        strokeWeight(radius / 10);
        stroke(255, (noiserad % 100) + 75, 0);
        fill(139, 69, 19); //brown meteor rock
        r = noise(noiserad) * radius / 2;

        vx = (mradius + r) * cos(i * 180 / radius);
        vy = (mradius + r) * sin(i * 180 / radius);
        vertex(tx + vx, ty + vy);
        noiserad++;
    }
    endShape(CLOSE);
    pop();
}

function backscene() {
    fill(255, 183, 53);
    noStroke();
    //Land
    beginShape();
    vertex(0, height);
    for (let x = 0; x <= width; x += res) {
        y = prop.elev * 0.95 - height * noise(x / 100) / 25;
        vertex(x, y);
    }
    vertex(width, height);
    endShape();
    islandWidth = 300;
    islandHeight = 50;
    //Island
    if (!(frameCount % prop.wavesp / 2) && screen == 'PLAY')
        ispx -= 1;
    if (ispx < -islandWidth / 2) {
        ispx = width + islandWidth / 2;
        noiseSeed(random(0, 100));
    }
    beginShape();
    for (let angle = -90; angle <= 90; angle++) {
        px = ispx + islandWidth * cos(90 - angle) / 2;
        py = prop.elev - islandWidth * sin(90 - angle) * noise(map(angle, -90, 90, 0.1, 1)) / 2;
        //py = noise(map(angle, 90, 0));
        if (angle == 0)
            image(tree, px, py - 200 + 10, 127, 200);
        vertex(px, py);
    }
    endShape();
}