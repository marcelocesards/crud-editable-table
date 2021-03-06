import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, ɵConsole } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { PrimeNGConfig } from 'primeng/api';
import { Table } from 'primeng/table';
import { consoleTestResultHandler } from 'tslint/lib/test';
import { CrudService } from '../../services/crud.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-table-crud',
  templateUrl: './table-crud.component.html',
  styleUrls: ['./table-crud.component.scss']
})
export class TableCrudComponent implements OnInit, OnChanges {
  @ViewChild(ConfirmDialogComponent) confirmDialogComponent:ConfirmDialogComponent;
  @ViewChild("dt") pTable;
  @Input() endpoint:string;
  @Input() id:string;
  idEdit;
  private lista:any[];
  @Input() cols: any[];
  @Input() rows: any[];
  @Output() salvar= new EventEmitter();
  @Input() isObjectId;
  @Input() filters:string[];
  @Input() objectFromater;
  clonedRows: { [s: string]: any; } = {};
  filterValue;
  
  constructor(private crudService:CrudService, private primengConfig: PrimeNGConfig, private toastr:ToastrService) { }
  
  setColumn(col, row, rowValue){
    return rowValue;
  }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.crudService.obsAtualizar.subscribe(objeto=>{
      this.carregarDados();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    for(const propName in changes){
      const changedProp = changes[propName];
      if(changedProp.isFirstChange){
        if(propName==='cols'){
          this.carregarDados();
        }
      }
    }
  }

  carregarDados(){
    this.crudService.get(this.endpoint).subscribe(lista=>{
      this.rows=lista;
      this.createCols(lista?lista[0]:{});    
    });
  }

  createCols(obj: any) {
    if(this.cols){
      this.configurarObjectId(obj);
      this.filters = this.cols.map(c=>c.field);
      return;
    }  
    this.idEdit=this.id;
    let keys = Object.keys(obj);
    this.filters = keys;
    this.cols = keys.map(k=>{
      let col:any={}
      col.field=k;
      col.header=k;
      return col;
    });
  }

  configurarObjectId(obj) {
    let value = obj[this.id];
    if(typeof value === "object"){
      this.isObjectId=true;
      this.rows.forEach(r=>{
        let idKeys = Object.keys(r[this.id]);
        if(idKeys)
          this.idEdit=idKeys[0];
        idKeys.forEach(idKey=>{
          r[idKey]=r[this.id][idKey];
        });
      });
    }else{
      this.idEdit=this.id;
    }
  }

  toObjectId(obj) {
    let value = obj[this.id];
    if(typeof value === "object"){
      this.isObjectId=true;
      let idKeys = Object.keys(obj[this.id]);
      for (let idkey of idKeys) {
        obj[this.id][idkey]=obj[idkey];
      }
    }
  }

  onRowEditInit(row) {
      this.clonedRows[row[this.id]] = {...row};
  }

  onRowEditSave(row) {
    this.salvarDados(row);
    delete this.clonedRows[row[this.id]];    
  }

  format(id){
    if(this.isObjectId&&this.objectFromater){
      return this.objectFromater.format(id);
    }
    return id;
  }

  async salvarDados(obj){
    this.toObjectId(obj);
    const id =this.format(obj[this.id]);
    try {      
      const existentItem = await this.crudService.getId(this.endpoint, id, [{"notnotify": 'true'}]).toPromise();
      const objAtualizado = await this.crudService.put(`${this.endpoint}/${id}`, obj).toPromise();
      this.crudService.subAtualizar.next(objAtualizado);
      this.toastr.success("Registro atualizado com sucesso!");  
    } catch (error) {
        const objAtualizado = await this.crudService.post(this.endpoint, obj).toPromise();
        this.crudService.subAtualizar.next(objAtualizado);
        this.toastr.success("Registro inserido com sucesso!");  
    } finally {
      this.clearFilter();
    }
  }

  onRowEditCancel(row, index: number) {
      if(row.isNew){
        this.crudService.subAtualizar.next(null);
        this.clearFilter();
      }
      else{
        this.rows[index] = this.clonedRows[row[this.id]];
      }        
      delete this.clonedRows[row[this.id]];
  }

  onRowEditRemove(row, ri){
    const id =this.format(row[this.id]);
    this.confirmDialogComponent.abrir(`Deseja mesmo remover o registro de ID: ${id}?`,{acao:"remover", obj:row});    
    delete this.clonedRows[row[this.id]]; 
  }

  /**
   * Evento emitido pelo modal de confirmação de salvar interação.
   * 
   * @param evento 
   */
  onDialogOk(retorno) {
    if (retorno.acao === 'remover'){
      this.removerDados(retorno.obj);      
    }
      
  }

  async removerDados(obj){
    try {
      const id =this.format(obj[this.id]);
      const existentItem = await this.crudService.getId(this.endpoint, id, [{"notnotify": 'true'}]).toPromise();
      const objAtualizado = await this.crudService.delete(this.endpoint,id).toPromise();
      this.crudService.subAtualizar.next(objAtualizado);
      this.toastr.success("Registro removido com sucesso!");  
    } catch (error) {
        this.toastr.success("Falha ao remover registro!");  
    } 
  }

  reset(){
    this.cols=[];
    this.rows=[];
  }

  /**
   * Adiciona uma nova linha na tabela na primeira posição do array de this.rows
   * 
   * é Setado o valor NOVO no campo indice da nova linha e é feito um filtro
   * na tabela para selecionar apenas a nova linha, assim se a tabela tiver muitas linhas,
   * a nova linha inserida não será perdida.
   */
  adicionar(){
    let novoRegistroValor="NOVO";
    let newObj:any={};
    if(this.isObjectId&&this.objectFromater){  
      newObj = this.criarNovaLinhaObjeto(novoRegistroValor); 
    }else{
     this.criarNovaLinha(newObj, novoRegistroValor)
    }    
    newObj.isNew=true;
  
    if(!this.rows){
      this.rows = [newObj];
    }else{
      this.rows.unshift(newObj);    
      this.setFiltro(novoRegistroValor);
    }   
    this.startEditRow();
  }

  /**
   * Se o ID for do tipo objeto, cria a nova linha no formato do objeto.
   * 
   * Em seguida ele insere o novoRegistroValor ("NOVO") nas propriedades
   * filhas do ID do objeto (existe um foreach feito no ID para
   * encontrar essas propriedades e setar o valor).
   */
  criarNovaLinhaObjeto(novoRegistroValor){
    let newObj = this.objectFromater;
    this.cols.forEach(c=>{
      if(c.type==='select'&&c.data&&typeof c.data[0]==="object"){
        c.data.unshift({value:novoRegistroValor, option:novoRegistroValor});
      }else if(c.type==='select'){
        c.data.unshift(novoRegistroValor);
      }
      Object.keys(newObj[this.id]).forEach(element => {
        newObj[element]=novoRegistroValor;   
      });
    }); 
    return newObj;
  }

  /**
   * Se o ID não for um objeto, cria uma nova linha baseada em string
   * 
   * Varre todas as colunas e encontra a coluna correspondente ao ID
   * em seguida, se o tipo for "select" adiciona um novo objeto
   * no col.data
   * Por fim, adiciona o valor do parametro novoRegistroValor no 
   * valor do id da linha nova criada
   * 
   * @param newObj Objeto que representa a Nova linha 
   * @param novoRegistroValor é o valor que será inserido no ID da nova linha para facilitar localizar esta nova linha na tabela.
   */
  criarNovaLinha(newObj, novoRegistroValor){
    this.cols.forEach(k=>{
      if(k.field===this.id){
        if(k.type==='select'){
          k.data.unshift({value:novoRegistroValor, option:novoRegistroValor});
        }
        newObj[k.field]=k.field===this.id?novoRegistroValor:undefined;
      }     
    });
  }

  setFiltro(value){
    this.pTable.filterGlobal(value, 'contains');
    this.filterValue = value;
  }

  clearFilter(){
    this.clear(this.pTable);
  }

  clear(table: Table) {
    table.clear();
    this.filterValue = undefined;
  }

  /**
   * Recebe do tamplate o array de dados do select e extrai a propriedade "option".
   * 
   * O Option retornado é usado como label do option do select e o objeto é
   * utilizado como value do option do select. assim, eu consigo exibir uma 
   * descrição para cada option e retornar o objeto com o valor original
   * para salvar na base.
   * 
   * @param objs Objetos que alimentam um select gravados no cols[*].data
   * @param valor Valor texto de uma coluna gravada na rows[col.field]
   */
  getDescription(objs,valor){
    if(objs&&typeof objs[0] ==="object"){
      let objetoSelecioando =  objs.find(o=>{
        return o.value===valor||o.option===valor;
      });
      return objetoSelecioando?objetoSelecioando.option:valor; 
    }else{
      return valor;
    }
  }

  /**
   * Recupera um evento disparado ao selecionar um novo valor em um select option
   * 
   * Se o valor disparado pelo evento for um objeto, então setamos a propriedade value (que guarda)
   * o valor original da tabela e salvamos no array de linhas, no campo correspondente ao 
   * col.field
   * 
   * Caso não seja um objeto, apenas salvamos esse valor na celula correta da tabela
   * indicada pelo col.field.
   * 
   * Por fim existe uma validação onde se a coluna alterada for o id da tabela, então
   * será necessário tornar a linha editavel novamente, pois ao alterar o id, a linha
   * deixa de ser editavel
   * 
   * @param $event Valor disparado pelo evento
   * @param row a linha da tabela em que o evento foi disparado
   * @param col a coluna da tabela em que o evento foi disparado
   */
  selectEvent($event, row, col){
    if(typeof $event==='object'){
      row[col.field]=$event.value;
    }else{
      row[col.field]=$event;
    } 
    if(col.field===this.idEdit)
      this.startEditRow(row);
  }

  startEditRow(row=this.rows[0]){
    this.pTable.initRowEdit(row);
  }
}
