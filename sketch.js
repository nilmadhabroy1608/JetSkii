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
let oceanFloor;
let fireLines;
let ind;
let bg;
let cond;

let fr=[];

function preload(){
    //theme song
    //song = loadSound('./sound/TheOcean.mp3');
    song = loadSound('./sound/LifeIsMusic.mp3');
    //Cover Image
    cover = loadImage('./images/JetSkii.png');
    //Jet (main object)
    rider = loadImage('./images/jet.gif');
    //sound On image
    //sOn = loadImage('./images/soundOn.png');
    //sound Off image
    //sOff = loadImage('./images/soundOff.png');
    //background tree image
    //tree = loadImage('./images/tree.png');
    //font load
    bcr = loadFont('./assets/BalooChettan-Regular.ttf');
    sso = loadFont('./assets/SonsieOne.ttf');

}

function setup(){

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
    screen='START';

    //getting best window width/height size
    winSize = window.innerWidth;
    if (window.innerHeight < winSize)
        winSize = window.innerHeight;
    winSize = int(winSize/res) * res;

    //setting canvas size
    createCanvas(winSize, winSize);

    //global parameter-type setting
    angleMode(DEGREES);
    ellipseMode(CENTER);
    textAlign(CENTER, CENTER);

    //sound setting
    getAudioContext().resume();
    //sound mode setting
    song.playMode('restart');
    //sound start
    song.loop();

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
    score = 1;

    jet = {
        width: 15 * (width / 60), //15:9
        height: 9 * (width / 60), //15:9
        speed: width / 60,
    };
    jet.x = - jet.width / 2;
    jet.y = prop.elev - jet.tide / 2;
    rider.pause();
    rider.setFrame(0);
    rider.delay(100);

    drag = 0;

    halt = {
        play: {
            s: height * width / 200 / 20,
        },
        pause: {
            s: height / 20,
            x: width * 18 / 20,
            y: height / 20,
        }
    };

    nOff = 0;
    fireOffset = 0;

    ind=0;
    updateFire(prop.meteorSize);

    meteors = [];
    for (let i = 0; i < prop.numMeteors; i++)
        addMeteor(i);

    health = 100;
    dec = 100;

    //damage = 255 ;

    tossAngle = 0;

    bg = 0;

    //ocean floor
    //surf = color(151, 221, 223, 200);//surface color
    surf = color(50, 157, 202, 200);
    //flor = color(110, 177, 183, 255);//floor color
    flor = color(32, 100, 129, 255);//floor color
    oceanFloor=[];
    for (let i = prop.elev,inc = res / 2; i <= height; i += inc) {
        oceanFloor.push({
            col : lerpColor(surf, flor, map(i, prop.elev, height, 0, 1)),
            val : i,
        });
    }
}

function draw() {

    //JET MOVEMENT/CONTROLS
    if(screen=='PLAY'){
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
    } else if(screen == 'OVER' && jet.x > -jet.width/2){
        drag=0;
        jet.x -= res / 1.5;
        jet.y = lerp(jet.y, height, 0.05);
    }
    
    //Background
    background(222, 235, 247);

    //WAVE UPDATION
    updateWave();

    for(let i = 0; i < prop.numMeteors; i++){
        let m = meteors[i];
        //CRASH
        if(!m.c && (m.y + m.r) > (jet.y - jet.height / 2) && (m.y - m.r) < (jet.y + jet.height / 2) && abs(m.x - jet.x) < (m.r + jet.width / 2))
            dec = crashCheck(m, jet, dec);

        let val = res * prop.meteorSize * ((pixelDensity() > 1)?2:1) / 25;
        //METEORS
        if (screen == 'PLAY' || screen == 'OVER'){
            let val = res * prop.meteorSize * ((pixelDensity() > 1)?2:1) / 25;
            displayMeteor(m, val);

            if (meteors.length < prop.numMeteors)
                addMeteor(0);
            updateMeteor(i);
        }
    }

    //JET UPDATION AND DISPLAY
    if((screen == 'OVER' && jet.x >= -jet.width/2) || screen == 'PLAY' || screen == 'PAUSE' || screen=='HEADSTART'){
        //wp = slideJet(jet, prop);
        displayJet(jet, slideJet(jet, prop.tide));
    }

    //WAVE
    createWave();

    if (screen=='HEADSTART') {
        let h=height/8;
        push();
        rectMode(CORNERS);
        if(jet.x > width/4)
            h=map(jet.x, width/4, width/2, height/8, 0);
        fill(0);
        rect(0,0,width, h);
        rect(0,height - h,width, height);
        pop();
    } else {
        //To Various SCREEN States
        showState();
        if (screen=='PLAY' || screen=='PAUSE' || screen=='HEADSTART') {
            //SCORE
            showScore();
            //HEALTH
            showHealthBar();
        }
    } 

}

function mouseDragged() {
    cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (cond && drag == 0 && screen=='PLAY')
        drag = mouseX - jet.x;
}

function mouseReleased() {
    drag = 0;
}

function mousePressed() {
    cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (mouseX > halt.pause.x && mouseX < halt.pause.x + halt.pause.s && mouseY > halt.pause.y && mouseY < halt.pause.y + halt.pause.s && screen == 'PLAY') {
        screen = "PAUSE";
        noLoop();
    } else if(abs(mouseX - width/2) < halt.play.s/2 && abs(mouseY - height/2) < halt.play.s/2 && screen == 'PAUSE'){
        screen = "PLAY";
        loop();
    } else if(cond && screen=='START'){
        screen='HEADSTART';
        loop();
    }
    return false;
}

function keyPressed() {
    if (key === ' ') {
        if (screen == "PLAY") {
            screen = "PAUSE";
            noLoop();
        } else if (screen == "PAUSE") {
            screen = "PLAY";
            loop();
        } else if (screen == "START") {
            screen = "HEADSTART";
            loop();
        }
    }
}

function slideJet(jet, td) {
    let wp;
    if (screen=='HEADSTART'){
        jet.x = jet.x + res / 10;
        wp = abs(floor(jet.x / res));
        jet.y = waves[wp] - td / 2;
        if(jet.x >= width / 2)
            screen='PLAY'
    } else {
        wp = floor(jet.x / res);

        if(screen == 'PLAY'){
        //for smooth bounce
            newY = waves[wp] - td/2;
            let amt = 0.99;
            if (jet.y < newY)
                amt = 0.1;
            jet.y = lerp(jet.y, newY, amt);
        }
    }
    return wp;
}

function displayJet(jet, pt) {
    push();
    translate(jet.x, jet.y);
    if(screen == 'PLAY' || screen == 'PAUSE' || screen=='HEADSTART'){
        const inc = floor(jet.width / res / 2) - 1;
        const dy = waves[pt + inc] - waves[pt - inc];
        const dx = res * inc * 2;
        const angle = atan(dy/dx);
        rotate(angle);
    } else if (screen == 'OVER'){
        rotate(tossAngle);
        tossAngle -= 10;
    }
    if(rider.getCurrentFrame() == rider.numFrames()-1){
        rider.pause();
        rider.setFrame(0);
    }
    image(rider, -jet.width / 2, -jet.height / 2, jet.width, jet.height); //jet
    pop();
}

function crashCheck(m, jet, d) {

    const x1 = 0;
    const y1 = jet.height;
    const x2 = jet.width;
    const y2 = jet.height * 5.75 / 9;
    const x3 = jet.width * 4.74 / 15;
    const y3 = 0;

    //slopes
    const m1 = (y2 - y3) / (x2 - x3); //slope1
    const m2 = (y3 - y1) / (x3 - x1); //slope2

    //y-intercepts
    const c1 = (y3 + jet.y - y1 / 2) - m1 * (x3 + jet.x - x2 / 2); //y-intercept1
    const c2 = (y1 + jet.y - y1 / 2) - m2 * (x1 + jet.x - x2 / 2); //y-intercept2

    //perpendicular distance
    const d1 = abs(-m1 * m.x + m.y - c1) / sqrt((m1 * m1) + 1);
    const d2 = abs(-m2 * m.x + m.y - c2) / sqrt((m2 * m2) + 1);

    //If crashed i.e. crash boundary crossed
    if ((m.x <= (jet.x - x2 / 2 + x3) && d2 < m.r / 2) || (m.x > (jet.x - x2 / 2 + x3) && d1 < m.r / 2)) {
        //damage = 0;
        m.c = true;
        rider.play();
        return constrain(d - m.r, 0, 100);
    }
    return d;
}

function updateFire(size){
    fireLines = [];
    const rad = width * size / 187.5;
    for(let i = 0; i < width * size / 75; i++){
        const len =  rad * 2 * (1 + noise(fireOffset));
        fireLines.push({
            col : color(255, (random() > 0.4)?175:75, 0),
            x : len * cos(90 + prop.slant),
            y : len * sin(90 + prop.slant),
        });
        fireOffset++;
    }
}

function addMeteor(index) {
    const rad=floor(random(width * prop.meteorSize / 250, width * prop.meteorSize / 150));
    const temp = [];
    for(let i = 0; i < 360; i += res){
        cons = rad * (1 + noise(nOff) / 2); //Rock Disfiguration
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
        sp : (curLevel > 4)?prop.meteorSpeed:random(prop.meteorSpeed, prop.meteorSpeed * 1.25),
    });
}

function displayMeteor(m, val){
    push();
    translate(m.x, m.y);
    strokeWeight(val);
    let p;
    for(let i = -m.r / sqrt(2), l = -i, inc = val/1.4; i <= l && m.y < prop.elev; i += inc){
        p = fireLines[ind];
        stroke(p.col);
        line(i, i, i + p.x , i - p.y);
        ind = (ind+1)%fireLines.length;
    }
    
    beginShape();
    stroke(255, (nOff % 100) + 75, 0);
    fill(139, 69, 19);//brown color
    rotate(m.ang);                          //REMOVE ROTATION
    for(let i = 0; i < m.pts.length; i++){
        vertex(m.pts[i].x, m.pts[i].y);
    }
    endShape(CLOSE);
    m.ang -= (m.ang)?20:-360;
    pop();
}

function updateMeteor(index){
    const m = meteors[index];
    //Shifting Meteors
    m.x -= m.sp;
    m.y += m.sp;

    if(m.y > prop.elev && !m.d && m.x > 0 && m.x < width){
        waveHeight = m.r * 1.25;
        let low = floor((m.x - waveHeight * 5)/res); //floor((m.x - m.r * 4)/res);
        let upp = ceil((m.x + waveHeight * 4)/res);  //floor((m.x - m.r * 4)/res);
        low = (low < 0)?0:low;
        upp = (upp >= waves.length)?waves.length-1:upp;
        for(let j = low; j <= upp; j++){
            //elevating/rising/creating waves
            waves[j] -= waveHeight * (1 - cos(map(j, low, upp, 0, 360)));
        }
        m.d = true;
    }

    //create new ones when a meteor drowns or goes out of the visible area
    if((m.y - m.r) > (prop.elev + prop.tide * 1.5) || (m.x + m.r) < 0){
        meteors.splice(index, 1);
        addMeteor(index);
    }
}

function createWave() {
    noStroke();
    //fill(color(151, 221, 223, 200));
    fill(color(50,157,202, 200));

    //displaying surface waves pattern
    beginShape();
    vertex(0, prop.elev);
    for(let i = 0; i < waves.length; i++){
        // if(isNaN(waves[i]))
           // waves.splice(i,1);
        vertex(i * res, waves[i]);
    }
    vertex(width, prop.elev);
    endShape(CLOSE);

    //Ocean Floor
    for (let i = 0, inc = res / 2; i < oceanFloor.length; i++) {
        fill(oceanFloor[i].col);
        rect(0, oceanFloor[i].val, width, inc);
    }
}

function updateWave(){
    //Wave Shifting
    for (let i = 0; i <= prop.wavesp && (screen == 'PLAY' || screen == 'OVER' || screen == 'HEADSTART'); i += res) {
        //wave particle addition at the back/right
        waves.push(prop.elev - noise(waveOffset) * prop.tide);
        //wave particle removal from the front/left
        waves.shift();
        waveOffset += res / 200;
    }
}

function showState() {
    fill(255, 128, 0);  //orange color
    stroke(0);
    if (screen == 'PLAY') {
        //show PAUSE button
        push();
        translate(halt.pause.x, halt.pause.y);
        rect(0, 0, halt.pause.s / 3, halt.pause.s);
        rect(halt.pause.s * 2 / 3, 0, halt.pause.s / 3, halt.pause.s);
        pop();
    } else if (screen == 'PAUSE') {
        //show PLAY button
        push();
        background(0, 200);
        translate((width - halt.play.s)/2 , (height - halt.play.s)/2);
        triangle(0, 0, 0, halt.play.s, halt.play.s, halt.play.s / 2);
        pop();
    } else if (screen == 'OVER' && jet.x < -jet.width/2) {//GAME OVER SCREEN
        background(255, bg);
        bg = lerp(bg, 150, 0.05);
        if(bg >= 135){
            textSize(80);
            const avfr=fr.reduce((sum, x) => sum+x);
            text("RUDY\nDROWNED !\n\nScore : "+score+"\nAvg. Fr. : "+round(avfr/fr.length),width/2, height/2);
        }
    } else if (screen == 'START') {
        //START Screen Setting
        pr = color(184,77,97);//pinkish red
        db = color(37,50,85);//dark blue
        //bg = color(86,139,170);//bluish grey
        //mr = color(121,26,56);//maroonish red
        background(cover);
        textFont(sso, width/6);
        strokeWeight(10);
        fill(pr);//pinkish red
        stroke(db);//dark blue
        text("JetSkii",width/2, height/6);
        noLoop();
    }
    //use switch case instead of if-else after replacing screen values with numbers
}

function showScore() {
    //const fontSize = height * 5 / 76;
    //const posX = width / 20;
    //const posY = height * 18 / 20;
    push();
    noStroke();
    textAlign(LEFT, CENTER);
    textFont(bcr);
    strokeWeight(1);
    fill(255, 180, 0).textSize(height * 5 / 76);
    text('Score : ' + score, width / 20, height * 18 / 20);
    //if(screen == 'PLAY'){
        score = round(frameCount / 60);
        if(score != 0 && score % 10 === 0 && floor(score/10) > curLevel-1)
            levelChange(++curLevel);
    //}
    pop();
}

function showHealthBar() {
    stroke(0);
    fill(255);
    const h = height/30;
    const w = width/3;
    rect(h, h, w, h);
    health = lerp(health, dec, 0.2);
    fill((100 - health)*255/100, health*255/100, 0);
    rect(h, h, map(health, 0, 100, 0, w), h);
    fill(255).strokeWeight(3);
    textFont(bcr, h);
    if(frameCount % 10 == 0)
        fr.push(frameRate());
    text(/*"HEALTH"*/int(fr[fr.length-1]), h + w / 2, h + height / 100);

    if(health <= 0.5 && screen != 'OVER') {
        screen = 'OVER';
        tossAngle = 0;
    }
    strokeWeight(1);
}

function levelChange(lev){
    switch(lev){
        case 1:
            break;
        case 2:
            prop.numMeteors += 1;
            break;
        case 3:
            prop.meteorSpeed = width / 100;
            prop.wavesp += 2;
            break;
        case 4:
            prop.meteorSize += 1;
            updateFire(prop.meteorSize);
            break;
        case 5:
            //random meteor speeds
            break;
        case 6:
            prop.meteorSpeed = width / 80;
            prop.wavesp += 4;
            prop.slant -= 3;
            break;
        case 7:
            prop.numMeteors += 1;
            break;
        case 8:
            prop.meteorSpeed = width / 60;
            prop.wavesp += 4;
            prop.slant -= 2;
            break;
        case 9:
            prop.meteorSize += 1;
            updateFire(prop.meteorSize);
            break;
        case 10:
            prop.numMeteors += 1;
            break;
    }
}

//HEADSTART should be converted to screen='HEADSTART' option
//change jet.gif and background sky
//redefine sketch with more LOCAL variables rather than GLOBAL ones
//better levelChange(lev) function
//adding REPLAY and SHARE/SAVE button