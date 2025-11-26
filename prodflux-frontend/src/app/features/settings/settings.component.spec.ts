import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SettingsComponent } from './settings.component';
import { WorkshopsService } from './workshop.services';
import { VersionsService } from './versions.service';
import { VariantsService } from './variants.service';
import { MaterialCategoriesService } from './material-categories.service';
import { of } from 'rxjs';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    const workshopsSpy = jasmine.createSpyObj('WorkshopsService', ['getAll', 'create', 'update', 'delete']);
    const versionsSpy = jasmine.createSpyObj('VersionsService', ['getAll', 'create', 'update', 'delete']);
    const variantsSpy = jasmine.createSpyObj('VariantsService', ['getAll', 'create', 'update', 'delete']);
    const categoriesSpy = jasmine.createSpyObj('MaterialCategoriesService', ['getAll', 'create', 'update', 'delete']);

    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        HttpClientTestingModule,
        NoopAnimationsModule,
        FormsModule
      ],
      providers: [
        { provide: WorkshopsService, useValue: workshopsSpy },
        { provide: VersionsService, useValue: versionsSpy },
        { provide: VariantsService, useValue: variantsSpy },
        { provide: MaterialCategoriesService, useValue: categoriesSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;

    // Setup default return values
    workshopsSpy.getAll.and.returnValue(of([]));
    versionsSpy.getAll.and.returnValue(of([]));
    variantsSpy.getAll.and.returnValue(of([]));
    categoriesSpy.getAll.and.returnValue(of([]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
