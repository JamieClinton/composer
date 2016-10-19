import {Component, Input, OnInit, OnDestroy} from "@angular/core";
import {FormGroup, REACTIVE_FORM_DIRECTIVES, FORM_DIRECTIVES, Validators, FormBuilder} from "@angular/forms";
import {Subscription} from "rxjs/Subscription";
import {BaseCommandService, BaseCommand} from "../../../../services/base-command/base-command.service";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ExpressionModel} from "cwlts/models/d2sb";
import {ExpressionSidebarService} from "../../../../services/sidebars/expression-sidebar.service";

require("./base-command-form.components.scss");
require("./shared/form.components.scss");

@Component({
    selector: 'base-command-form',
    providers: [
        BaseCommandService
    ],
    directives: [
        REACTIVE_FORM_DIRECTIVES,
        FORM_DIRECTIVES
    ],
    template: `
             <form *ngIf="baseCommandForm" [formGroup]="baseCommandForm">
                <fieldset class="form-group">
                        <button type="button" class="btn btn-link hide-btn">Hide</button>
               
                        <label>Base Command</label>
                        <label class="secondary-label">What command do you want to call from the image</label>
                                                
                        <div *ngIf="baseCommandFormList.length > 0">
        
                            <div *ngFor="let baseCommand of baseCommandFormList; let i = index; trackBy:trackByIndex"
                                 class="base-command-list">
                                 
                                <expression-input class="col-sm-11"
                                                  *ngIf="baseCommandForm.controls['baseCommand' + i]" 
                                                  [(expression)]="baseCommandFormList[i]"
                                                  [control]="baseCommandForm.controls['baseCommand' + i]"
                                                  (onSelect)="editBaseCommand(i)">
                                </expression-input>
                              
                                <span class="close-icon col-sm-1">
                                    <i class="fa fa-times" (click)="removeBaseCommand(i)"></i>
                                </span>
                            </div> <!-- base-command-list-->
                        </div> <!-- list container-->
        
                        <div *ngIf="baseCommandFormList.length === 0" class="col-sm-12">
                                No base command defined.
                        </div>
                </fieldset>
                
                 <button type="button" 
                         class="btn btn-secondary add-input-btn"
                         (click)="addBaseCommand()">Add base command</button>
             </form>
    `
})
export class BaseCommandFormComponent implements OnInit, OnDestroy {

    @Input()
    public toolBaseCommand: BaseCommand[];

    /** The parent forms group, we pass this to the list */
    @Input()
    public baseCommandForm: FormGroup;

    /** The formatted list that we are going to display to the user*/
    private baseCommandFormList: ExpressionModel[] = [];

    private subs: Subscription[];

    /** Expression values coming from the expression editor subs */
    private expressionInputSub: Subscription;

    private selectedIndex: number;

    constructor(private baseCommandService: BaseCommandService,
                private formBuilder: FormBuilder,
                private expressionSidebarService: ExpressionSidebarService) {

        this.subs = [];
    }

    ngOnInit(): void {

        const inputBaseCommands = this.baseCommandService.baseCommandsToFormList(this.toolBaseCommand);
        this.baseCommandService.setBaseCommands(inputBaseCommands);

        this.subs.push(
            this.baseCommandService.baseCommands.subscribe((commandList: ExpressionModel[]) => {
                this.baseCommandFormList = commandList;
                this.createExpressionInputControls(this.baseCommandFormList);

                //Format the base commands from the inputs, and set the tool baseCommand
                this.toolBaseCommand = this.baseCommandService.formListToBaseCommandArray(this.baseCommandFormList);
            })
        );
    }

    private trackByIndex(index: number): any {
        return index;
    }

    private createExpressionInputControls(commandList: ExpressionModel[]) {
        commandList.forEach((command, index) => {
            if (this.baseCommandForm.contains('baseCommand' + index)) {
                this.baseCommandForm.removeControl('baseCommand' + index);
            }

            const formValue: string = command.getEvaluatedValue();
            const expressionInputForm: FormGroup = this.formBuilder.group({
                ['baseCommand' + index]: [formValue, Validators.compose([Validators.required, Validators.minLength(1)])]
            });

            this.baseCommandForm.addControl('baseCommand' + index, expressionInputForm.controls['baseCommand' + index]);

            this.baseCommandForm.controls['baseCommand' + index].valueChanges.subscribe(value => {
                this.baseCommandService.updateCommand(index, new ExpressionModel({
                    value: value,
                    evaluatedValue: value
                }));
            });
        });
    }

    private removeBaseCommand(index: number): void {
        this.baseCommandForm.removeControl('baseCommand ' + index);
        this.baseCommandService.deleteBaseCommand(index);

        if (this.selectedIndex === index) {
            this.expressionSidebarService.closeExpressionEditor();
        }

        if (this.selectedIndex > index) {
            this.selectedIndex--;
        } else if (this.selectedIndex === index) {
            this.selectedIndex = undefined;
        }
    }

    private editBaseCommand(index: number): void {
        const newExpression: BehaviorSubject<ExpressionModel> = new BehaviorSubject<ExpressionModel>(undefined);
        const selectedBaseCommand = this.baseCommandFormList[index];

        this.selectedIndex = index;
        this.removeExpressionInputSub();

        this.expressionInputSub = newExpression
            .filter(expression => expression !== undefined)
            .subscribe((expression: ExpressionModel) => {
                this.baseCommandService.updateCommand(index, expression);
            });

        this.expressionSidebarService.openExpressionEditor({
            expression: selectedBaseCommand.getExpressionScript(),
            newExpressionChange: newExpression
        });
    }

    private addBaseCommand(): void {
        this.baseCommandService.addCommand(new ExpressionModel({
            value: "",
            evaluatedValue: ""
        }));
    }

    private removeExpressionInputSub(): void {
        if (this.expressionInputSub) {
            this.expressionInputSub.unsubscribe();
            this.expressionInputSub = undefined;
        }
    }

    ngOnDestroy(): void {
        this.removeExpressionInputSub();
        this.subs.forEach(sub => sub.unsubscribe());
    }
}
