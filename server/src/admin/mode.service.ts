import { OperationMode } from './types';

export class ModeService {
  private currentMode: OperationMode = OperationMode.GUI_CHAT;

  getCurrentMode(): OperationMode {
    return this.currentMode;
  }

  setMode(mode: OperationMode): OperationMode {
    this.currentMode = mode;
    return this.currentMode;
  }

  toggleMode(): OperationMode {
    this.currentMode = 
      this.currentMode === OperationMode.IDE_ONLY 
        ? OperationMode.GUI_CHAT 
        : OperationMode.IDE_ONLY;
    
    return this.currentMode;
  }

  isChatEnabled(): boolean {
    return this.currentMode === OperationMode.GUI_CHAT;
  }
}
