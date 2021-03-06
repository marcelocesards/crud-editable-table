import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

/**
 * Este componente visa disponbilizar um select parametrizavel
 * 
 * @example
 * 
 * ```
 * <app-select 
 *    [objs]="objetos" 
 *    [label]="label" 
 *    [selectedString]="valorDefault" 
 *    (selectEvent)="selectEvent($event)">
 * </app-select>
 * ```
 */

@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.css']
})
export class SelectComponent implements OnInit, OnChanges {
  @Input() selectedObj:any;
  @Input() selectedString:string;
  @Input() label:string;
  @Input() objs:any[];
  @Input() classes:string[];
  @Output() selectEvent = new EventEmitter();
  constructor() { }

  ngOnInit(): void {
  }

  get selected(){
    return [this.selectedObj]
  }

  /**
   * Metodo do proprio angular destinado a 
   * buscar alterações de parametros @input()
   * 
   * Destina-se a efetuar uma ação ao carregar o 
   * input "selectedObj", neste caso, selecionar um objeto
   * em um array de objetos
   * 
   * @param changes 
   */
  ngOnChanges(changes: SimpleChanges): void {
    for(const propName in changes){
      const changedProp = changes[propName];
      if(changedProp.isFirstChange){
        if(propName==='selectedString'){
          this.selectedObj=this.selectObj(this.objs,this.selectedString);
        }
      }
    }
  }

  /**
   * Seleciona um valor em um combobox
   * 
   * Caso o combobox seja de string, ele devolvera
   * o parametro "valor"
   * 
   * @param objs Objetos de um combobox
   * @param valor Valor a ser selecionado no combobox
   */  
  selectObj(objs:any[],valor){
    let objetoSelecioando;
    if(objs){
      objetoSelecioando = objs.find(o=>{
        return o.value===valor;
      });
    }
    if(objetoSelecioando&&typeof objetoSelecioando==="object"){
      return objetoSelecioando;
    }else{
      return valor;
    }
  }

  /**
   * Devolve o valor selecionado
   * 
   * para recuperar o valor selecionado basta
   * escutar a variavel 
   * 
   * @example
   * 
   * ```
   * [selectEvent]="metodoQueReceberaOValorSelecionado($event)"
   * ```
   * 
   */

  returnValue(){
    this.selectEvent.emit(this.selectedObj);
  }

}
