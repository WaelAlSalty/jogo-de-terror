export class UIManager {
  public menuScreen = document.getElementById('menu-screen')!;
  public hud = document.getElementById('hud')!;
  public roomInput = document.getElementById('room-code') as HTMLInputElement;
  public statusMessage = document.getElementById('status-message')!;
  public roomDisplay = document.getElementById('room-display')!;
  public threatLevel = document.getElementById('threat-level')!;
  public dangerVignette = document.getElementById('danger-vignette')!;
  public touchControls = document.getElementById('touch-controls')!;
  public interactPrompt = document.getElementById('interact-prompt')!;

  public showHUD(roomText: string): void {
    this.menuScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.roomDisplay.innerText = roomText;

    if ('ontouchstart' in window) {
      this.touchControls.style.display = 'block';
    }
  }

  public showInteract(text: string | null): void {
    if (text) {
      this.interactPrompt.innerText = text;
      this.interactPrompt.style.display = 'block';
    } else {
      this.interactPrompt.style.display = 'none';
    }
  }

  public setDanger(ratio: number): void {
    this.dangerVignette.style.boxShadow = `inset 0 0 ${ratio * 130}px rgba(220, 38, 38, ${ratio * 0.9})`;
    this.threatLevel.innerText = ratio > 0.6 ? 'AMEA?A: CR?TICA' : ratio > 0.2 ? 'AMEA?A: DETECTADA' : 'AMEA?A: BAIXA';
    this.threatLevel.style.color = ratio > 0.6 ? '#ef4444' : ratio > 0.2 ? '#f59e0b' : '#10b981';
  }

  public setError(msg: string): void {
    this.statusMessage.innerText = msg;
  }
}
