import { HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { Observable } from "rxjs";
import { Subject } from "rxjs/internal/Subject";
import { BridgeService } from "./bridge.service";

const BACKEND_CONTEXT = "/gestaoapolice/emissao/api/indice";


@Injectable({
    providedIn:'root'
})
export class CrudService {
    public subAtualizar= new Subject<any>();
    public obsAtualizar= this.subAtualizar.asObservable();
    
    constructor(private bridgeService: BridgeService,  private toastr: ToastrService) {
    }
   
    /**
     * Recupera uma lista de objetos
     * 
     * @param endpoint nome do endpoint. podem ser passados parametros de url, ex.: nomeEndpoint/${id}?queryParam=123&queryParam=456
     */
    get(endpoint): Observable<any[]> {
        return this.bridgeService.get(`${BACKEND_CONTEXT}/${endpoint}/`);
    }
    /**
     * Insere um novo ogjeto
     * 
     * @param endpoint endereco api
     * @param obj objeto a ser persistido
     */
    post(endpoint, obj: any): Observable<any> {
      return this.bridgeService.post(`${BACKEND_CONTEXT}/${endpoint}/`, obj);
    } 
    
    /**
     * Delete por id
     * 
     * @param endpoint caminho para remover
     * @param id id do registro a ser removido
     */
    delete(endpoint,id) {
      return this.bridgeService.delete(`${BACKEND_CONTEXT}/${endpoint}/${id}`);
    }

    /**
     * Envia um put para a API de Backend
     * 
     * @param endpoint nomeEndpoint/${id}
     * @param obj Objeto a ser persistido
     */
    put(endpoint, obj: any):  Observable<any> {
      return this.bridgeService.put<any>(`${BACKEND_CONTEXT}/${endpoint}/`, obj);
    }
  
    /**
     * Retorna um objeto específico pelo ID.
     * 
     * {headers: {notstart: "true", notnotify: "true"}}
     * 
     * @param endpoint 
     * @param id 
     */
    getId(endpoint, id, requestOption?): Observable<any> {
      return this.bridgeService.get(`${BACKEND_CONTEXT}/${endpoint}/${id}`, null, {headers: {notstart: "true", notnotify: "true"}});
    }

    /**
     * Search
     * 
     * @param endpoint endpoint do endereço a ser pesquisado
     * @param parametros 
     */
    getSearch(endpoint,parametros: string): Observable<any> {
      return this.bridgeService.get(`${BACKEND_CONTEXT}/${endpoint}/spec?search=${parametros}`);
    }    
}