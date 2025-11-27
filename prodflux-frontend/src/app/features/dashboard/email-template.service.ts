import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EmailTemplate {
  id: number;
  name: string;
  language: string;
  language_display: string;
  template_type: string;
  template_type_display: string;
  subject: string;
  body: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateCreate {
  name: string;
  language: string;
  template_type: string;
  subject: string;
  body: string;
  is_active?: boolean;
  is_default?: boolean;
}

export interface EmailTemplateRenderRequest {
  template_id?: number;
  language?: string;
  template_type?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  order_number?: string;
  tracking_link?: string;
  company_name?: string;
}

export interface EmailTemplateRenderResponse {
  template_id: number;
  template_name: string;
  language: string;
  language_display: string;
  subject: string;
  body: string;
  email: string;
  mailto_link: string;
}

export interface Placeholder {
  key: string;
  description: string;
}

export interface LanguageOption {
  code: string;
  name: string;
}

export interface TemplateTypeOption {
  code: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailTemplateService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/shopbridge/email-templates`;

  /**
   * Alle Email-Templates abrufen
   */
  getTemplates(filters?: {
    language?: string;
    template_type?: string;
    active?: boolean;
  }): Observable<EmailTemplate[]> {
    let params: { [key: string]: string } = {};

    if (filters?.language) {
      params['language'] = filters.language;
    }
    if (filters?.template_type) {
      params['template_type'] = filters.template_type;
    }
    if (filters?.active !== undefined) {
      params['active'] = filters.active.toString();
    }

    return this.http.get<EmailTemplate[]>(this.apiUrl + '/', { params });
  }

  /**
   * Einzelnes Template abrufen
   */
  getTemplate(id: number): Observable<EmailTemplate> {
    return this.http.get<EmailTemplate>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Neues Template erstellen
   */
  createTemplate(template: EmailTemplateCreate): Observable<EmailTemplate> {
    return this.http.post<EmailTemplate>(this.apiUrl + '/', template);
  }

  /**
   * Template aktualisieren
   */
  updateTemplate(id: number, template: Partial<EmailTemplateCreate>): Observable<EmailTemplate> {
    return this.http.patch<EmailTemplate>(`${this.apiUrl}/${id}/`, template);
  }

  /**
   * Template löschen
   */
  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Template mit Kontext rendern und mailto-Link generieren
   */
  renderTemplate(request: EmailTemplateRenderRequest): Observable<EmailTemplateRenderResponse> {
    return this.http.post<EmailTemplateRenderResponse>(`${this.apiUrl}/render/`, request);
  }

  /**
   * Verfügbare Platzhalter abrufen
   */
  getPlaceholders(): Observable<{ placeholders: Placeholder[] }> {
    return this.http.get<{ placeholders: Placeholder[] }>(`${this.apiUrl}/placeholders/`);
  }

  /**
   * Verfügbare Sprachen und Template-Typen abrufen
   */
  getLanguagesAndTypes(): Observable<{
    languages: [string, string][];
    template_types: [string, string][];
  }> {
    return this.http.get<{
      languages: [string, string][];
      template_types: [string, string][];
    }>(`${this.apiUrl}/languages/`);
  }

  /**
   * Empfohlene Sprache für ein Land ermitteln
   */
  getLanguageForCountry(countryCode: string): Observable<{
    country: string;
    language: string;
  }> {
    return this.http.get<{
      country: string;
      language: string;
    }>(`${this.apiUrl}/language-for-country/`, {
      params: { country: countryCode }
    });
  }

  /**
   * Absender-Konfiguration abrufen
   */
  getSenderConfig(): Observable<{
    sender_name: string;
    sender_email: string;
    sender_phone: string;
    company_name: string;
  }> {
    return this.http.get<{
      sender_name: string;
      sender_email: string;
      sender_phone: string;
      company_name: string;
    }>(`${this.apiUrl}/sender-config/`);
  }
}
