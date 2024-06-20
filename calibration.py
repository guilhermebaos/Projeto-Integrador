from machine import Pin

def LEDs_calibration(dif, vesq=25, aesq=26, v=27, adir=32, vdir=33, lim_ama=3, lim_verm=10):
    '''
    Acende no array de LEDs a cor correspondente à calibração.
    Para dif = (valor_site - valor_labview) / valor_labview * 100, temos:
    --- |dif| < lim_ama -> acende o verde
    --- -lim_verm <= dif <= -lim_ama -> acende o amarelo à esquerda
    --- dif < -lim_verm -> acende o vermelho à esquerda
    --- dif > lim_verm -> acende o vermelho à direita
    --- lim_ama <= dif <= lim_verm -> acende o amarelo à direita
    '''

    # definir os LEDs
    verm_esq = Pin(vesq, Pin.OUT)
    ama_esq = Pin(aesq, Pin.OUT)
    verde = Pin(v, Pin.OUT)
    ama_dir = Pin(adir, Pin.OUT)
    verm_dir = Pin(vdir, Pin.OUT)

    # desligar todos os LEDs
    for led in [verm_esq, ama_esq, verde, ama_dir, verm_dir]:
        led.value(False)

    # selecionar qual LED se liga
    if abs(dif) < lim_ama:
        verde.value(True)
    elif -lim_verm <= dif <= -lim_ama:
        ama_esq.value(True)
    elif lim_ama <= dif <= lim_verm:
        ama_dir.value(True)
    elif dif > lim_verm:
        verm_dir.value(True)
    elif dif < -lim_verm:
        verm_esq.value(True)

    # print(verm_esq.value(), ama_esq.value(), verde.value(), ama_dir.value(), verm_dir.value())
