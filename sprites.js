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

  var SPRITES = {
    colors: C,
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
