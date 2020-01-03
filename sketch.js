let waves;
let res;
let prop;
let screen;
let waveOffset;
let jet;
let headstart;
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
let rider;
let song;
let ind;
let bg;

let fr=0;

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

    //game resolution
    res = 20;

    //set screen status
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
    rider.pause();
    rider.setFrame(0);
    rider.delay(100);

    wp = abs(floor(jet.x / res));   //wave particle that's elevating the jet
    y = waves[wp] - prop.tide/2;

    headstart = true;

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

    //Start Screen Setting
    pr = color(184,77,97);//pinkish red
    //                  bg = color(86,139,170);//bluish grey
    //                  mr = color(121,26,56);//maroonish red
    db = color(37,50,85);//dark blue
    background(cover);
    textFont(sso, width/6);
    strokeWeight(10);
    fill(pr);//pinkish red
    stroke(db);//dark blue
    text("JetSkii",width/2, height/6);
    noLoop();

    //font setting
    textFont(bcr);
    strokeWeight(1);
}

function draw() {

    if(screen=='PLAY' || screen=='PAUSE' || screen=='OVER'){

        //JET MOVEMENT/CONTROLS
        if(!headstart && screen=='PLAY'){
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
            if (keyIsDown(RIGHT_ARROW))
                jet.x = constrain(jet.x + move, boundary.left, boundary.right);
        } else if(screen == 'OVER' && jet.x > -jet.width/2){
            drag=0;
            jet.x -= res / 1.5;
            jet.y = lerp(jet.y, height, 0.05);
        }
        
        //Background
        background(222, 235, 247);

        //METEORS
        if ((screen == 'PLAY' || screen == 'OVER') && !headstart){
            displayMeteor();
            updateMeteor();
        }

        //WAVE UPDATION
        updateWave();

        //JET UPDATION AND DISPLAY
        if((screen == 'OVER' && jet.x >= -jet.width/2) || screen == 'PLAY' || screen == 'PAUSE'){
            slideJet();
            displayJet();
        }

        //CRASH
        crashCheck();

        //WAVE
        createWave();

        if(!headstart){
            if (screen!='OVER') {
                //SCORE
                showScore();
                //HEALTH
                showHealthBar();
            }
            //PLAY/PAUSE BUTTON
            playpause();
        } else {
            push();
            rectMode(CORNERS);
            if(jet.x < width/4)
                h=height/8
            else
                h=map(jet.x, width/4, width/2, height/8, 0);
            fill(0);
            rect(0,0,width, h);
            rect(0,height - h,width, height);
            pop();
        }

    }    
}

function mouseDragged() {
    cond = (mouseX > 0 && mouseX < width) && (mouseY > 0 && mouseY < height);
    if (cond && drag == 0 && !headstart && screen=='PLAY')
        drag = mouseX - jet.x;
}

function mouseReleased() {
    drag = 0;
}

function mousePressed() {
    cond = mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height;
    if (mouseX > halt.pause.x && mouseX < halt.pause.x + halt.pause.s && mouseY > halt.pause.y && mouseY < halt.pause.y + halt.pause.s && screen == 'PLAY' && !headstart) {
        screen = "PAUSE";
        noLoop();
    } else if(abs(mouseX - width/2) < halt.play.s/2 && abs(mouseY - height/2) < halt.play.s/2 && screen == 'PAUSE'){
        screen = "PLAY";
        loop();
    } else if(cond && screen=='START'){
        screen='PLAY';
        loop();
    }
    return false;
}

function keyPressed() {
    if (key === ' ') {
        if (screen == "PLAY" && !headstart) {
            screen = "PAUSE";
            noLoop();
        } else if (screen == "PAUSE" || screen == "START") {
            screen = "PLAY";
            loop();
        }
    }
}

function slideJet() {
    if (headstart){
        jet.x = jet.x + res / 10;
        wp = abs(floor(jet.x / res));
        jet.y = waves[wp] - prop.tide / 2;
        headstart = !(jet.x >= width / 2);
    } else {
        wp=floor(jet.x / res);

        if(screen == 'PLAY'){
        //for smooth bounce
            newY = waves[wp] - prop.tide/2;
            let amt = 0.99;
            if (jet.y < newY)
                amt = 0.1;
            if (screen != 'PLAY')
                amt = 0;
            jet.y = lerp(jet.y, newY, amt);

            // if(jet.y < newY)
            //     jet.y += (newY - jet.y) * 0.2;

            //jet.y = newY;
        }
    }
}

function displayJet() {
    push();
    translate(jet.x, jet.y);
    if(screen == 'PLAY' || screen == 'PAUSE'){
        let inc = floor(jet.width / res / 2) - 1;
        let dy = waves[wp + inc] - waves[wp - inc];
        let dx = res * inc * 2;
        let angle = atan(dy/dx);
        /*if(tossAngle == 0){
            angle = atan(dy/dx);//when angle is >=45 degrees forward then stay in that position for a while
        }
        if (angle < -10){
            rotate(angle);
            tossAngle = angle;
        }*/
        rotate(angle);
    } else if (screen == 'OVER'){
        rotate(tossAngle);
        tossAngle -= 10;
    }
    /*if (damage <= 250) {
        damage = lerp(damage, 255, 0.2);
        tint(255, damage, damage);
    }*/
    if(rider.getCurrentFrame() == rider.numFrames()-1){
        rider.pause();
        rider.setFrame(0);
    }
    image(rider, -jet.width / 2, -jet.height / 2, jet.width, jet.height); //jet
    pop();
}

function crashCheck() {
    for (let i = 0; i < prop.numMeteors; i++) {
        if (meteors[i].c)
            continue;
        let m = meteors[i];
        if (!m.c && (m.y + m.r) > (jet.y - jet.height / 2) && (m.y - m.r) < (jet.y + jet.height / 2) && abs(m.x - jet.x) < (m.r + jet.width / 2)) {
            
            x1 = 0;
            y1 = jet.height;
            x2 = jet.width;
            y2 = jet.height * 5.75 / 9;
            x3 = jet.width * 4.74 / 15;
            y3 = 0;

            //slopes
            m1 = (y2 - y3) / (x2 - x3); //slope1
            m2 = (y3 - y1) / (x3 - x1); //slope2

            //y-intercepts
            c1 = (y3 + jet.y - y1 / 2) - m1 * (x3 + jet.x - x2 / 2); //y-intercept1
            c2 = (y1 + jet.y - y1 / 2) - m2 * (x1 + jet.x - x2 / 2); //y-intercept2

            //perpendicular distance
            d1 = abs(-m1 * m.x + m.y - c1) / sqrt((m1 * m1) + 1);
            d2 = abs(-m2 * m.x + m.y - c2) / sqrt((m2 * m2) + 1);

            //If crashed i.e. crash boundary crossed
            if ((m.x <= (jet.x - x2 / 2 + x3) && d2 < m.r / 2) || (m.x > (jet.x - x2 / 2 + x3) && d1 < m.r / 2)) {
                //damage = 0;
                dec = constrain(dec - m.r, 0, 100);
                m.c = true;
                rider.play();
            }
        }
    }
}

function updateFire(size){
    fireLines = [];
    rad = width * size / 187.5;//width * prop.meteorSize * (1 / 250 + 1 / 150) / 2
    for(let i = 0; i < width * size / 75; i++){
        len =  rad * 2 * (1 + noise(fireOffset));
        fireLines.push({
            col : color(255, (random() > 0.4)?175:75, 0),
            x : len * cos(90 + prop.slant),
            y : len * sin(90 + prop.slant),
        });
        fireOffset++;
    }
}

function addMeteor(index) {
    rad=floor(random(width * prop.meteorSize / 250, width * prop.meteorSize / 150));
    temp = [];
    for(let i = 0; i < 360; i += res){
        cons = rad * (1 + noise(nOff) / 2); //Rock Disfiguration
        temp.push({
            x : cons * cos(i),
            y : cons * sin(i),
        });
        nOff++;
    }
    /*temp2 = [];
    for(let i = -rad / sqrt(2), inc = res * prop.meteorSize / 35, l = -i; i <= l; i += inc){
        len = rad * 2 * (1 + noise(fireOffset));
        //line(i, i, i + len * cos(90 + prop.slant), i - len * sin(90 + prop.slant));
        temp2.push({
            col : color(255, (random() > 0.4)?175:75, 0),
            x : len * cos(90 + prop.slant),
            y : len * sin(90 + prop.slant),
        });
        fireOffset++;
    }*/
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

function displayMeteor(){
    let val = res * prop.meteorSize / 25;
    val *= (pixelDensity() > 1)?2:1;
    for(m of meteors){
        push();
        translate(m.x, m.y);
        strokeWeight(val);
        //inc = res * prop.meteorSize / 35;
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
        
        /*
        for(let i = m.off, lim = (m.off)?m.off-1:m.pts.length; i != lim; i++){
            if(i==m.pts.length){
                i=0;
                ++lim;
            }
            vertex(m.pts[i].x, m.pts[i].y);
        }
        m.off=(m.off+1)%m.pts.length;
        
        endShape(CLOSE);
        */
        pop();
    }
}

function updateMeteor(){
    if (meteors.length < prop.numMeteors)
        addMeteor(0);

    for (let i = 0; i < prop.numMeteors; i++){
        m=meteors[i];
        //Shifting Meteors
        m.x -= m.sp;
        m.y += m.sp;

        if(m.y > prop.elev && !m.d && m.x > 0 && m.x < width){
            waveHeight = m.r * 1.25;
            low = floor((m.x - waveHeight * 5)/res); //floor((m.x - m.r * 4)/res);
            upp = ceil((m.x + waveHeight * 4)/res);  //floor((m.x - m.r * 4)/res);
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
            meteors.splice(i, 1);
            addMeteor(i);
        }
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
    for (let i = 0; i <= prop.wavesp && (screen == 'PLAY' || screen == 'OVER'); i += res) {
        //wave particle addition at the back/right
        waves.push(prop.elev - noise(waveOffset) * prop.tide);
        //wave particle removal from the front/left
        waves.shift();
        waveOffset += res / 200;
    }
}

function playpause() {
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
    } else if (screen == 'OVER' && jet.x < -jet.width/2) {
        background(255, bg);
        bg = lerp(bg, 150, 0.05);
        if(bg >= 135){
            textSize(80);
            text("RUDY\nDROWNED !\n\nScore : "+score,width/2, height/2);
        }
    }
}

function showScore() {
    fontSize = height * 5 / 76;
    posY = height * 18 / 20;
    posX = width / 20;
    push();
    noStroke();
    textAlign(LEFT, CENTER);
    fill(255, 180, 0).textSize(fontSize);
    text('Score : ' + score, posX, posY);
    if(screen == 'PLAY'){
        score = round(frameCount / 60);
        if(score != 0 && score % 10 === 0 && floor(score/10) > curLevel-1)
            levelChange(++curLevel);
    }
    pop();
}

function showHealthBar() {
    stroke(0);
    fill(255);
    h = height/30;
    w = width/3;
    rect(h, h, w, h);
    health = lerp(health, dec, 0.2);
    fill((100 - health)*255/100, health*255/100, 0);
    rect(h, h, map(health, 0, 100, 0, w), h);
    fill(255).textSize(h).strokeWeight(3);

    if(frameCount % 10 == 0)
        fr=frameRate();
    text(/*"HEALTH"*/int(fr), h + w / 2, h + height / 100);

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
            prop.meteorSpeed = width / 80;
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
            prop.meteorSpeed = width / 60;
            prop.wavesp += 4;
            prop.slant -= 5;
            break;
        case 7:
            prop.numMeteors += 1;
            break;
        case 8:
            prop.meteorSize += 1;
            updateFire(prop.meteorSize);
            break;
        case 9:
            prop.numMeteors += 1;
            break;
    }
}

//HEADSTART should be converted to screen='HEADSTART' option
//Meteor's LOOP should be in draw function rather than in displayMeteor() and updateMeteor()
//change of WATER COLOR to color(110,177,183); and change jet.gif and background sky
//redefine sketch with more LOCAL variables rather than GLOBAL ones
//better levelChange(lev) function
//adding REPLAY and SHARE/SAVE button