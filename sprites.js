/*
 * La Grande Évasion — Sprites pixel art (rendu procédural)
 * -------------------------------------------------------
 * Plutôt que des feuilles PNG externes, les sprites sont dessinés
 * directement sur le canvas à partir de petits blocs de pixels. Le rendu
 * reste 100 % statique et sans dépendance : chaque animal est composé sur
 * une grille logique de 16 × 16 pixels, puis agrandi sans lissage.
 *
 * SPRITES.animal(ctx, id, ox, oy, u)  dessine l'animal `id`, coin haut-gauche
 *   en (ox, oy), chaque pixel logique mesurant `u` pixels du canvas.
 * SPRITES.icon(ctx, type, ox, oy, u)  dessine l'icône d'une case spéciale.
 */
(function (global) {
  "use strict";

  // Palette partagée.
  var C = {
    out: "#221d2e", wht: "#f7f7fb", off: "#d7dde3", cream: "#f3ead2",
    gry: "#aab1ba", gryD: "#7b828c", gryDD: "#565d67",
    gold: "#f2c14e", goldD: "#cf8f2a",
    brn: "#a06a37", brnD: "#6b431f", tan: "#d19a63",
    org: "#f2872e", orgD: "#c9631a",
    pnk: "#f39ac0", pnkD: "#dd6ba0",
    grn: "#46b25f", grnD: "#2c8342",
    ice: "#5cc4e8", iceD: "#2f9bc4",
    blk: "#2b2f3a", drk: "#1c2029",
    eye: "#1c2029", red: "#e0574a", yel: "#ffd94a",
    shadow: "rgba(20,16,30,0.18)"
  };

  function mk(ctx, ox, oy, u) {
    return function (gx, gy, gw, gh, col) {
      ctx.fillStyle = col;
      ctx.fillRect(ox + gx * u, oy + gy * u, gw * u, gh * u);
    };
  }

  // ------------------------------------------------------------------ animals
  // Each drawer composes a front-facing "bust" recognisable by silhouette+colour.
  var animals = {
    lion: function (g) {
      g(3, 1, 10, 12, C.brnD);            // mane ring
      g(2, 3, 12, 8, C.brnD);
      g(4, 0, 3, 3, C.gold); g(9, 0, 3, 3, C.gold); // ears
      g(4, 3, 8, 8, C.gold);              // face
      g(3, 4, 10, 6, C.gold);
      g(5, 5, 2, 2, C.eye); g(9, 5, 2, 2, C.eye);
      g(5, 8, 6, 3, C.cream);             // muzzle
      g(7, 8, 2, 1, C.blk);               // nose
      g(7, 9, 1, 2, C.brnD);              // mouth
    },
    elephant: function (g) {
      g(0, 4, 4, 6, C.gry); g(12, 4, 4, 6, C.gry);   // big ears
      g(0, 5, 3, 4, C.gryD); g(13, 5, 3, 4, C.gryD);
      g(3, 2, 10, 10, C.gry);             // head
      g(4, 1, 8, 1, C.gry);
      g(5, 4, 2, 2, C.eye); g(9, 4, 2, 2, C.eye);
      g(7, 7, 2, 6, C.gryD);              // trunk
      g(7, 12, 3, 2, C.gryD);
      g(6, 10, 1, 2, C.wht); g(9, 10, 1, 2, C.wht);  // tusks
    },
    girafe: function (g) {
      g(6, 8, 4, 8, C.gold);              // long neck
      g(5, 2, 6, 7, C.gold);             // head
      g(6, 0, 1, 2, C.brnD); g(9, 0, 1, 2, C.brnD);  // ossicones
      g(5, 1, 1, 1, C.gold); g(10, 1, 1, 1, C.gold);
      g(6, 4, 1, 2, C.eye); g(9, 4, 1, 2, C.eye);
      g(6, 6, 4, 2, C.tan);              // snout
      g(5, 10, 2, 2, C.brnD); g(9, 12, 2, 2, C.brnD); g(7, 9, 2, 2, C.brnD); // spots
    },
    singe: function (g) {
      g(1, 3, 3, 4, C.brn); g(12, 3, 3, 4, C.brn);   // ears
      g(2, 4, 2, 2, C.tan); g(12, 4, 2, 2, C.tan);
      g(3, 1, 10, 12, C.brn);             // head
      g(4, 4, 8, 8, C.tan);              // face
      g(5, 5, 2, 2, C.eye); g(9, 5, 2, 2, C.eye);
      g(6, 8, 4, 3, C.brn);              // muzzle
      g(7, 9, 1, 1, C.eye); g(8, 9, 1, 1, C.eye);    // nostrils
    },
    panda: function (g) {
      g(3, 0, 3, 3, C.blk); g(10, 0, 3, 3, C.blk);   // ears
      g(3, 2, 10, 11, C.wht);             // head
      g(2, 4, 12, 7, C.wht);
      g(4, 4, 3, 3, C.blk); g(9, 4, 3, 3, C.blk);    // eye patches
      g(5, 5, 2, 2, C.wht); g(10, 5, 1, 1, C.wht);
      g(5, 5, 1, 1, C.eye); g(10, 5, 1, 1, C.eye);
      g(7, 8, 2, 2, C.blk);              // nose
      g(7, 10, 1, 2, C.gryDD);
    },
    manchot: function (g) {
      g(4, 1, 8, 13, C.blk);              // body/head
      g(3, 5, 10, 8, C.blk);
      g(5, 4, 6, 8, C.wht);              // white belly/face
      g(6, 4, 1, 2, C.eye); g(9, 4, 1, 2, C.eye);
      g(7, 6, 2, 2, C.org);              // beak
      g(4, 13, 3, 2, C.org); g(9, 13, 3, 2, C.org);  // feet
    },
    flamant: function (g) {
      g(7, 6, 3, 9, C.pnk);              // curved neck
      g(6, 8, 2, 3, C.pnk); g(9, 9, 2, 3, C.pnk);
      g(6, 2, 6, 5, C.pnk);             // head
      g(9, 4, 1, 2, C.eye);             // eye
      g(11, 4, 4, 2, C.blk);            // beak (bent, black tip)
      g(10, 3, 3, 2, C.pnkD);
      g(7, 13, 1, 3, C.orgD); g(9, 13, 1, 3, C.orgD); // legs
    },
    crocodile: function (g) {
      g(2, 5, 12, 5, C.grn);             // head/body
      g(1, 7, 14, 3, C.grnD);            // long snout base
      g(9, 8, 6, 3, C.grn);             // snout extends right
      g(9, 10, 6, 1, C.grnD);
      g(3, 3, 2, 3, C.grn); g(3, 3, 2, 2, C.grnD);   // eye bump
      g(3, 4, 1, 1, C.eye);
      // teeth
      g(9, 7, 1, 1, C.wht); g(11, 7, 1, 1, C.wht); g(13, 7, 1, 1, C.wht);
      g(3, 10, 2, 2, C.grnD); g(6, 10, 2, 2, C.grnD); // back scutes
    },
    zebre: function (g) {
      g(4, 1, 8, 12, C.wht);              // head
      g(3, 4, 10, 7, C.wht);
      g(4, 0, 2, 3, C.wht); g(10, 0, 2, 3, C.wht);   // ears
      g(4, 0, 2, 3, C.gryDD); g(10, 0, 2, 3, C.gryDD);
      g(5, 2, 1, 9, C.blk); g(7, 2, 1, 9, C.blk); g(9, 2, 1, 9, C.blk); // stripes
      g(4, 3, 2, 1, C.blk); g(10, 3, 2, 1, C.blk);
      g(5, 5, 1, 2, C.eye); g(9, 5, 1, 2, C.eye);    // eyes (drawn over)
      g(6, 10, 4, 3, C.gry);            // snout
      g(7, 11, 1, 1, C.eye); g(8, 11, 1, 1, C.eye);
    },
    hibou: function (g) {
      g(3, 1, 4, 3, C.brnD); g(9, 1, 4, 3, C.brnD);  // feather tufts
      g(3, 2, 10, 11, C.brn);             // body
      g(2, 4, 12, 7, C.brn);
      g(3, 4, 4, 4, C.cream); g(9, 4, 4, 4, C.cream); // big eye discs
      g(4, 5, 2, 2, C.eye); g(10, 5, 2, 2, C.eye);
      g(4, 5, 1, 1, C.wht); g(10, 5, 1, 1, C.wht);
      g(7, 6, 2, 2, C.org);             // beak
      g(4, 11, 3, 2, C.brnD); g(9, 11, 3, 2, C.brnD); // belly feathers
    }
  };

  // ------------------------------------------------------------------- icons
  var icons = {
    banane: function (g) {                // banana
      g(4, 9, 2, 2, C.goldD);
      g(5, 7, 2, 3, C.gold); g(7, 5, 2, 3, C.gold);
      g(9, 4, 2, 3, C.gold); g(10, 3, 2, 2, C.gold);
      g(11, 3, 1, 1, C.brnD);
    },
    toboggan: function (g) {              // up arrow (shortcut)
      g(7, 3, 2, 9, C.ice);
      g(5, 5, 2, 2, C.ice); g(9, 5, 2, 2, C.ice);
      g(4, 6, 2, 2, C.iceD); g(10, 6, 2, 2, C.iceD);
      g(6, 4, 4, 1, C.wht);
    },
    gardien: function (g) {               // guard cap
      g(3, 7, 10, 2, C.blk);
      g(4, 4, 8, 3, C.blk);
      g(6, 5, 4, 2, C.yel);            // badge
      g(3, 8, 10, 1, C.gryDD);
    },
    defi: function (g) {                  // lightning (timed)
      g(8, 3, 3, 4, C.yel);
      g(6, 6, 4, 2, C.yel);
      g(7, 7, 3, 4, C.yel);
      g(5, 9, 4, 3, C.yel);
    },
    duel: function (g) {                  // crossed swords
      g(3, 4, 2, 2, C.gry); g(5, 6, 2, 2, C.gry); g(7, 8, 2, 2, C.gry); g(9, 10, 2, 2, C.gry);
      g(11, 4, 2, 2, C.gry); g(9, 6, 2, 2, C.gry);
      g(4, 10, 3, 2, C.goldD); g(9, 10, 3, 2, C.goldD);
    },
    mystere: function (g) {               // question mark
      g(5, 3, 5, 2, C.wht);
      g(9, 4, 2, 3, C.wht); g(7, 6, 2, 2, C.wht); g(6, 8, 2, 2, C.wht);
      g(6, 11, 2, 2, C.wht);
    },
    obstacle: function (g) {              // barrier / gate
      g(3, 4, 10, 2, C.red); g(3, 8, 10, 2, C.wht); g(3, 6, 10, 2, C.red);
      g(3, 4, 2, 8, C.gryDD); g(11, 4, 2, 8, C.gryDD);
    },
    portal: function (g) {                // grand gate
      g(2, 3, 2, 11, C.gryDD); g(12, 3, 2, 11, C.gryDD);
      g(2, 2, 12, 2, C.goldD);
      g(5, 4, 1, 9, C.gold); g(7, 4, 2, 9, C.gold); g(10, 4, 1, 9, C.gold);
      g(4, 7, 8, 1, C.gold);
    },
    start: function (g) {                 // paw / flag
      g(6, 3, 4, 6, C.grn); g(6, 3, 1, 8, C.brnD);
      g(7, 4, 2, 2, C.wht);
    }
  };

  // ---------------------------------------------------------------- scenery
  // Décors dessinés directement en coordonnées logiques (x,y) avec échelle s.
  function R(ctx,x,y,w,h,c){ ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
  function CIR(ctx,x,y,r,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.arc(x,y,r,0,6.2832); ctx.fill(); }
  function ELL(ctx,x,y,rx,ry,c){ ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(x,y,rx,ry,0,0,6.2832); ctx.fill(); }

  var GR="#3f8f45", GRD="#2c6f36", GRL="#63c77d", BR="#8a5a2b", BRD="#5f3a16";

  var deco = {
    tree: function(ctx,x,y,s){
      R(ctx,x-2*s,y-2*s,4*s,8*s,BRD);
      CIR(ctx,x,y-6*s,9*s,GRD);
      CIR(ctx,x-6*s,y-3*s,6*s,GRD); CIR(ctx,x+6*s,y-3*s,6*s,GRD);
      CIR(ctx,x,y-8*s,7*s,GR); CIR(ctx,x-4*s,y-4*s,4.5*s,GR); CIR(ctx,x+4*s,y-4*s,4.5*s,GR);
      CIR(ctx,x-2*s,y-9*s,3*s,GRL);
    },
    pine: function(ctx,x,y,s){
      R(ctx,x-1.5*s,y-1*s,3*s,6*s,BRD);
      R(ctx,x-8*s,y-4*s,16*s,4*s,GRD); R(ctx,x-6*s,y-8*s,12*s,4*s,GR);
      R(ctx,x-4*s,y-11*s,8*s,4*s,GRD); R(ctx,x-2*s,y-14*s,4*s,4*s,GR);
    },
    acacia: function(ctx,x,y,s){
      R(ctx,x-1*s,y-2*s,2*s,9*s,BRD);
      ELL(ctx,x,y-8*s,11*s,3.5*s,GRD); ELL(ctx,x,y-9.5*s,8*s,2.6*s,GR);
      ELL(ctx,x,y-4*s,6*s,2*s,GRD);
    },
    palm: function(ctx,x,y,s){
      ctx.save(); ctx.fillStyle=BR; ctx.translate(x,y); ctx.rotate(0.08);
      R(ctx,-1.2*s,-13*s,2.4*s,15*s,BR); ctx.restore();
      R(ctx,x-10*s,y-13*s,9*s,2.4*s,GR); R(ctx,x+1*s,y-13*s,9*s,2.4*s,GR);
      R(ctx,x-8*s,y-15*s,6*s,2.4*s,GRD); R(ctx,x+2*s,y-15*s,6*s,2.4*s,GRD);
      R(ctx,x-3*s,y-16*s,6*s,3*s,GR);
      CIR(ctx,x-1*s,y-12*s,1.4*s,"#caa24a"); CIR(ctx,x+2*s,y-12*s,1.4*s,"#caa24a");
    },
    bush: function(ctx,x,y,s){
      CIR(ctx,x-3*s,y,3.2*s,GRD); CIR(ctx,x+3*s,y,3.2*s,GRD); CIR(ctx,x,y-2*s,4*s,GR);
      CIR(ctx,x-1*s,y-3*s,1.6*s,GRL);
    },
    pond: function(ctx,x,y,w,h){
      ELL(ctx,x,y,w+3,h+3,"#2f6f9e"); ELL(ctx,x,y,w,h,"#4aa3d4");
      ELL(ctx,x-w*0.3,y-h*0.3,w*0.35,h*0.28,"#8fd0ef");
    },
    rock: function(ctx,x,y,s){
      ELL(ctx,x,y,6*s,4*s,"#565b63"); ELL(ctx,x-1*s,y-1*s,4.4*s,2.9*s,"#767c86");
      ELL(ctx,x-2*s,y-2*s,2*s,1.3*s,"#9aa0a8");
    },
    rockPile: function(ctx,x,y,s){
      deco.rock(ctx,x-3.5*s,y+1.5*s,s); deco.rock(ctx,x+3.5*s,y+1.5*s,s); deco.rock(ctx,x,y-2*s,s*1.1);
    },
    flower: function(ctx,x,y,col){
      R(ctx,x-3,y-1,2,2,col); R(ctx,x+1,y-1,2,2,col); R(ctx,x-1,y-3,2,2,col); R(ctx,x-1,y+1,2,2,col);
      R(ctx,x-1,y-1,2,2,"#ffe58a");
    },
    tuft: function(ctx,x,y,s){
      for(var i=-2;i<=2;i++){ R(ctx,x+i*2*s,y-(2-Math.abs(i))*1*s,1.4*s,4*s,(i%2)?"#3c9a53":GRD); }
    },
    bamboo: function(ctx,x,y,s){
      for(var i=0;i<3;i++){ var bx=x+i*3*s; R(ctx,bx,y-14*s,2*s,14*s,"#4fae5a"); R(ctx,bx,y-10*s,2*s,1,GRD); R(ctx,bx,y-6*s,2*s,1,GRD); }
      R(ctx,x-2*s,y-16*s,5*s,3*s,GR); R(ctx,x+4*s,y-13*s,4*s,2.5*s,GRD);
    },
    ice: function(ctx,x,y,s){
      R(ctx,x-7*s,y-4*s,14*s,9*s,"#bfe9fb"); R(ctx,x-7*s,y-4*s,14*s,3*s,"#e8f8ff");
      R(ctx,x-7*s,y+2*s,14*s,3*s,"#8fd0ef");
      ctx.strokeStyle="#7fc0e0"; ctx.lineWidth=1; ctx.strokeRect(x-7*s,y-4*s,14*s,9*s);
      R(ctx,x-4*s,y-8*s,6*s,4*s,"#dff4ff");
    },
    fence: function(ctx,x,y,w,s){
      R(ctx,x,y-1*s,w,1.4*s,BR); R(ctx,x,y+2*s,w,1.4*s,BR);
      for(var i=0;i<=w;i+=6*s){ R(ctx,x+i,y-3*s,1.5*s,7*s,"#a06a37"); }
    },
    bench: function(ctx,x,y,s){
      R(ctx,x-6*s,y-3*s,12*s,2*s,"#a06a37"); R(ctx,x-6*s,y,12*s,2*s,BR);
      R(ctx,x-5*s,y+2*s,1.5*s,3*s,BRD); R(ctx,x+4*s,y+2*s,1.5*s,3*s,BRD);
    },
    lamp: function(ctx,x,y,s){
      R(ctx,x-1*s,y-12*s,2*s,12*s,"#3a3f4a"); CIR(ctx,x,y-13*s,2.6*s,"#ffe07a"); CIR(ctx,x,y-13*s,1.2*s,"#fff6c8");
    },
    fountain: function(ctx,x,y,s){
      ELL(ctx,x,y,11*s,5*s,"#8a8f98"); ELL(ctx,x,y,8.5*s,3.6*s,"#4aa3d4");
      R(ctx,x-1*s,y-8*s,2*s,6*s,"#8a8f98"); CIR(ctx,x,y-9*s,2.2*s,"#8fd0ef");
    },
    sign: function(ctx,x,y,text){
      var w=Math.max(34,text.length*4.4+12);
      R(ctx,x-1.5,y-2,3,12,BRD);
      R(ctx,x-w/2,y-14,w,12,BR); R(ctx,x-w/2,y-14,w,2,BRD); R(ctx,x-w/2,y-4,w,2,BRD);
      ctx.fillStyle="#f3ead2"; ctx.font="bold 7px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(text,x,y-8);
    },
    star: function(ctx,x,y,r,col){
      ctx.beginPath();
      for(var i=0;i<5;i++){
        var a=-Math.PI/2+i*2*Math.PI/5;
        ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);
        var a2=a+Math.PI/5;
        ctx.lineTo(x+Math.cos(a2)*r*0.45,y+Math.sin(a2)*r*0.45);
      }
      ctx.closePath(); ctx.fillStyle=col||"#ffd94a"; ctx.fill();
      ctx.strokeStyle="#c9971f"; ctx.lineWidth=1; ctx.stroke();
    },
    gate: function(ctx,cx,y,s){
      R(ctx,cx-46*s,y-4*s,12*s,42*s,"#6b7078"); R(ctx,cx+34*s,y-4*s,12*s,42*s,"#6b7078");
      R(ctx,cx-46*s,y-4*s,4*s,42*s,"#7c828c"); R(ctx,cx+42*s,y-4*s,4*s,42*s,"#565b63");
      R(ctx,cx-48*s,y-9*s,16*s,5*s,"#565b63"); R(ctx,cx+32*s,y-9*s,16*s,5*s,"#565b63");
      CIR(ctx,cx-40*s,y-12*s,3*s,"#3a3f4a"); CIR(ctx,cx+40*s,y-12*s,3*s,"#3a3f4a");
      CIR(ctx,cx-40*s,y-13*s,1.4*s,"#ffe07a"); CIR(ctx,cx+40*s,y-13*s,1.4*s,"#ffe07a");
      // banner
      R(ctx,cx-36*s,y-22*s,72*s,13*s,"#7a1f1f"); R(ctx,cx-36*s,y-9*s,4*s,4*s,"#5a1414"); R(ctx,cx+32*s,y-9*s,4*s,4*s,"#5a1414");
      ctx.fillStyle="#f2c14e"; ctx.font="bold "+Math.round(9*s)+"px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("LIBERTÉ !",cx,y-15*s);
      // grille
      R(ctx,cx-34*s,y,68*s,38*s,"#2b2f3a");
      for(var i=-30;i<=30;i+=6){ R(ctx,cx+i*s,y+3*s,2*s,32*s,"#454b57"); }
      R(ctx,cx-34*s,y+3*s,68*s,3*s,"#454b57"); R(ctx,cx-34*s,y+33*s,68*s,3*s,"#454b57"); R(ctx,cx-34*s,y+17*s,68*s,2*s,"#454b57");
      // cadenas
      R(ctx,cx-7*s,y+13*s,14*s,13*s,"#e0c04a"); R(ctx,cx-3.5*s,y+8*s,7*s,7*s,"#c9971f");
      ctx.fillStyle="#3a2f10"; ctx.font="bold "+Math.round(7*s)+"px monospace"; ctx.fillText("50",cx,y+20*s);
    },
    zoo: function(ctx,cx,y,s){
      R(ctx,cx-32*s,y-2*s,64*s,28*s,"#6b7078");
      R(ctx,cx-32*s,y-4*s,64*s,4*s,"#7c828c");
      // damier de pierres
      ctx.fillStyle="#5b6169";
      for(var r=0;r<3;r++) for(var c2=0;c2<8;c2++){ if((r+c2)%2) R(ctx,cx-32*s+c2*8*s,y+r*8*s,8*s,8*s,"#5b6169"); }
      // tunnel
      ctx.fillStyle="#20242e"; ctx.beginPath();
      ctx.moveTo(cx-13*s,y+26*s); ctx.lineTo(cx-13*s,y+9*s);
      ctx.arc(cx,y+9*s,13*s,Math.PI,0); ctx.lineTo(cx+13*s,y+26*s); ctx.closePath(); ctx.fill();
      // enseigne ZOO
      R(ctx,cx-20*s,y-15*s,40*s,11*s,"#3a2f22");
      ctx.fillStyle="#f2c14e"; ctx.font="bold "+Math.round(9*s)+"px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("ZOO",cx,y-9*s);
    }
  };

  var SPRITES = {
    colors: C, deco: deco,
    R:R, circle:CIR, ellipse:ELL,
    animal: function (ctx, id, ox, oy, u) {
      var d = animals[id];
      if (!d) return;
      d(mk(ctx, ox, oy, u));
    },
    icon: function (ctx, type, ox, oy, u) {
      var d = icons[type];
      if (!d) return;
      d(mk(ctx, ox, oy, u));
    },
    hasAnimal: function (id) { return !!animals[id]; }
  };

  global.SPRITES = SPRITES;
  if (typeof module !== "undefined" && module.exports) { module.exports = SPRITES; }
})(typeof window !== "undefined" ? window : this);
