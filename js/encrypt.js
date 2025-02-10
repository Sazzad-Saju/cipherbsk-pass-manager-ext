function encrypt(M, keyGen) {
    //subkey1 operation
    M = M.split('');
    for (var i = 0; i < M.length; i++) {
        var mv = M[i].charCodeAt();
        if (mv == 10) {
            mv = 126;
        }
        var sk1v = keyGen.subkey1[i].charCodeAt();
        var pos = (mv + sk1v) % 94;
        if (pos < 32) {
            pos = pos + 94;
        }
        M[i] = String.fromCharCode(pos);
    }
    M = M.join("").toString();

    //padding
    //length formating
    while (M.length % 8 != 0) {
        M += '~';
    }

    //key-triggered indexing: subkey2
    M = M.split('');
    for (var i = M.length - 1; i >= 0; i--) {
        var t = keyGen.subkey2[i].charCodeAt();
        var j = t % M.length;
        [M[i], M[j]] = [M[j], M[i]];
    }

    //hexadecimal convertion and dopping
    for (var i = 0; i < M.length; i++) {
        M[i] = M[i].charCodeAt().toString(16);
        if (M[i] == '7e') {
            if (i % 2 == 0) {
                var numb = parseInt(rand() * max) % 32;
                M[i] = numb.toString(16);
                if (M[i].length != 2) {
                    M[i] = "0" + M[i];
                }
            } else {
                var numb = parseInt(rand() * max) % 256;
                if (numb < 126) {
                    numb += 130;
                }
                M[i] = numb.toString(16);
            }
        }
    }
    M = M.join("").toString().toUpperCase();

    return M;
}