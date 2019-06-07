import { Component, OnInit, TemplateRef } from '@angular/core';
import { EventoService } from '../_services/evento.service';
import { Evento } from '../_models/Evento';
import { BsModalRef, BsModalService } from 'ngx-bootstrap';
import { FormGroup, Validators, FormBuilder } from '@angular/forms';
import { defineLocale, BsLocaleService, ptBrLocale } from 'ngx-bootstrap';
import { templateJitUrl } from '@angular/compiler';
import { ToastrService } from 'ngx-toastr';
defineLocale('pt-br', ptBrLocale);

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {

  titulo = 'Eventos';
  eventosFiltrados: Evento[];
  eventos: Evento[];
  evento: Evento;
  modoSalvar: string;
  imagemLargura = 50;
  imagemMargem = 2;
  mostrarImagem = false;
  registerForm: FormGroup;
  bodyDeletarEvento: string;

  file: File;
  fileName: string;
  dataAtual: string;
  _FILTROLISTA: string;
  fileNameToUpdate: string;

  constructor(
      private eventoService: EventoService
    , private modalService: BsModalService
    , private fb: FormBuilder
    , private localeService: BsLocaleService
    , private toastr: ToastrService
    ) {
      this.localeService.use('pt-br');
     }

  ngOnInit() {
    this.validation();
    this.getEventos();
  }

  editarEvento(evento: Evento, template: any) {
    this.modoSalvar = 'put';
    this.openModal(template);
    this.evento = Object.assign({}, evento);
    this.fileNameToUpdate = this.evento.imagemURL.toString();
    this.evento.imagemURL = '';
    this.registerForm.patchValue(this.evento);
  }

  novoEvento(template: any) {
    this.modoSalvar = 'post';
    this.openModal(template);
  }

  excluirEvento(evento: Evento, template: any) {
    this.openModal(template);
    this.evento = evento;
    this.bodyDeletarEvento = `Tem certeza que deseja excluir o Evento: ${evento.tema}, Código: ${evento.id}`;
  }

  confirmeDelete(template: any) {
    this.eventoService.deleteEvento(this.evento.id).subscribe(
      () => {
          template.hide();
          this.getEventos();
          this.toastr.success('Deletado com sucesso');
        }, error => {
          console.log(error);
          this.toastr.error('Falha ao deletar');
        }
    );
  }

  openModal(template: any) {
    this.registerForm.reset();
    template.show();
  }

  get filtroLista(): string {
    return this._FILTROLISTA;
  }

  set filtroLista(value: string) {
    this._FILTROLISTA = value;
    this.eventosFiltrados = this.filtroLista ? this.filtrarEventos(this.filtroLista) : this.eventos;
  }

  filtrarEventos(filtrarPor: string): Evento[] {
    filtrarPor = filtrarPor.toLocaleLowerCase();
    return this.eventos.filter(
      evento => evento.tema.toLocaleLowerCase().indexOf(filtrarPor) !== -1
    );
    }

    alternarImagem() {
      this.mostrarImagem = !this.mostrarImagem;
    }

    validation() {
      this.registerForm = this.fb.group({
        tema: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
        local: ['', Validators.required],
        dataEvento: ['', Validators.required],
        qtdPessoas: ['', [Validators.required, Validators.max(120000)]],
        imagemURL: ['', Validators.required],
        telefone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]]
      });
    }

    onFileChange(event: any) {
      const reader = new FileReader();

      if (event.target.files && event.target.files.length) {
        this.file = event.target.files;
        this.fileName = this.file[0].name;
        console.log(this.file);
      }
    }

    uploadImagem() {

      if (this.modoSalvar === 'post') {
        const nomeArquivo = this.evento.imagemURL.split('\\', 3);
        this.evento.imagemURL = nomeArquivo[2];

        this.eventoService.postUpload(this.file, nomeArquivo[2])
        .subscribe(
          () => {
            this.dataAtual = new Date().getMilliseconds().toString();
            this.getEventos();
          }
        );
      } else {
        this.evento.imagemURL = this.fileNameToUpdate;
        this.eventoService.postUpload(this.file, this.fileNameToUpdate)
        .subscribe(
          () => {
            this.dataAtual = new Date().getMilliseconds().toString();
            this.getEventos();
          }
        );
      }

    }

    salvarAlteracao(template: any) {
      if (this.registerForm.valid) {
        if (this.modoSalvar === 'post') {
          this.evento = Object.assign({}, this.registerForm.value);

          this.uploadImagem();

          this.eventoService.postEvento(this.evento).subscribe(
            (novoEvento: Evento) => {
              console.log(novoEvento);
              template.hide();
              this.getEventos();
              this.toastr.success('Inserido com sucesso');
            }, error => {
              console.log(error);
              this.toastr.error('Falha ao inserir');
            }
          );
        } else {
          this.evento = Object.assign({id: this.evento.id}, this.registerForm.value);

          this.uploadImagem();

          this.eventoService.putEvento(this.evento).subscribe(
            (novoEvento: Evento) => {
              console.log(novoEvento);
              template.hide();
              this.getEventos();
              this.toastr.success('Editado com sucesso');
            }, error => {
              console.log(error);
              this.toastr.error('Falha ao editar');
            }
          );
        }
      }
    }

    getEventos() {
      this.eventoService.getAllEvento().subscribe(
        (eventos: Evento[]) => {
          this.eventos = eventos;
          this.eventosFiltrados = this.eventos;
        }, error => {
          this.toastr.error('Falha ao tentar carregar eventos');
        }
        );
      }
    }
