import { NPC, Sprite, Task } from '../helpers'
import { npcData } from '../data'
import { Observer } from './'
import { Movements, NPCList, Position, SceneTransition } from '../interfaces'

export class NPCManager extends Observer {
  private _currentLevel: string
  private _root: HTMLElement
  private _npcs: NPCList
  private npcData: any
  private _acceptedTasks: Set<string>
  constructor(
    currentLevel: string,
    root: HTMLElement
  ) {
    super()
    this._root = root
    this._currentLevel = currentLevel
    this._npcs = {}
    this.npcData = npcData[currentLevel]
    this._acceptedTasks = new Set(['npc-movement', 'scene-transition-start'])
  }
  handleUpdate({name, action}: Task): void {
    if (!this._acceptedTasks.has(name)) return
    switch (name) {
      case 'npc-movement':
        this.handleNPCMovement(action as keyof Movements)
      break
      case 'scene-transition-start':
        this.handleSceneTransitionStart(action)
      break
    }
  }
  handleNPCMovement(direction: keyof Movements): void {
    this._npcs[this._currentLevel].forEach(npc => npc.handleMovement(direction))
  }
  async handleSceneTransitionStart({ level }: SceneTransition): Promise<void> {
    this._npcs[this._currentLevel].forEach(npc => npc.ejectFromDom())
    this.switchLevel(level)
    let npcElements = null
    if(!this._npcs[this._currentLevel]) {
      npcElements = await this.init()
    } else {
      npcElements = this._npcs[this._currentLevel].map(npc => npc.domElement)
    }
    this._root.append(...npcElements)
  }
  switchLevel(newLevel: string) {
    this.npcData = npcData[newLevel]
    this._currentLevel = newLevel
  }
  async init(): Promise<Array<HTMLElement>> {
    const npcs = []
    const npcElements = []
    for (const npcKey in this.npcData) {
      const { path, startingPosition, facingPosition } = this.npcData[npcKey]
      const npc = new NPC(npcKey, path, facingPosition)
      npcs.push(npc)
      npcElements.push(await npc.init(startingPosition))
    }
    this._npcs[this._currentLevel] = npcs
    return npcElements
  }
}
