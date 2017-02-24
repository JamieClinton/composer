import {
    Component, ElementRef, Input, TemplateRef, ViewChild
} from "@angular/core";
import {StepModel, WorkflowInputParameterModel, WorkflowModel, WorkflowOutputParameterModel} from "cwlts/models";
import {Workflow} from "cwl-svg";
import {StatusBarService} from "../../../core/status-bar/status-bar.service";
import {EditorInspectorService} from "../../../editor-common/inspector/editor-inspector.service";
declare const Snap: any;
require("./workflow-graph-editor.component.scss");

@Component({
    selector: "ct-workflow-graph-editor",
    template: `
        <svg (click)="handleClick($event)" #canvas class="cwl-workflow"></svg>

        <template #controls>
            
            <span class="btn-group">
                    <button class="btn btn-sm btn-secondary" (click)="downscale()">-</button>
                    <button class="btn btn-sm btn-secondary"
                            (click)="graph.command('workflow.fit')">Fit to Viewport</button>
                    <button class="btn btn-sm btn-secondary" (click)="upscale()">+</button>
                
                </span>

        </template>

        <!--Inspector Template -->
        <template #inspector>
            <ct-editor-inspector-content>
                <div class="tc-header">{{ inspectedNode.id || inspectedNode.loc || typeOfInspectedNode()}}</div>
                <div class="tc-body">
                    <ct-workflow-step-inspector *ngIf="typeOfInspectedNode() === 'Step'"
                                                [step]="inspectedNode"
                                                [workflowModel]="model">
                    </ct-workflow-step-inspector>

                    <ct-workflow-input-inspector *ngIf="typeOfInspectedNode() === 'Input'"
                                                 [input]="inspectedNode">
                    </ct-workflow-input-inspector>

                    <ct-workflow-output-inspector *ngIf="typeOfInspectedNode() === 'Output'"
                                                  [output]="entry">
                    </ct-workflow-output-inspector>
                </div>
            </ct-editor-inspector-content>
        </template>
    `
})
export class WorkflowGraphEditorComponent {

    @Input()
    public model: WorkflowModel;

    @Input()
    public readonly = false;

    @ViewChild("canvas")
    private canvas: ElementRef;

    @ViewChild("controls")
    private controlsTemplate: TemplateRef<any>;

    @ViewChild("inspector", {read: TemplateRef})
    private inspectorTemplate: TemplateRef<any>;

    private inspectedNode: StepModel | WorkflowOutputParameterModel | WorkflowInputParameterModel = null;

    private graph: Workflow;

    constructor(private statusBar: StatusBarService, private inspector: EditorInspectorService) {
    }

    ngAfterViewInit() {

        this.graph = new Workflow(new Snap(this.canvas.nativeElement), this.model);
        this.statusBar.setControls(this.controlsTemplate);
        this.graph.command("workflow.fit");
    }

    private upscale() {
        this.graph.command("workflow.scale", this.graph.getScale() + .1);
    }

    private downscale() {
        if (this.graph.getScale() > .1) {
            this.graph.command("workflow.scale", this.graph.getScale() - .1);

        }
    }

    /**
     * Triggers when click events occurs on canvas
     */
    handleClick(ev : Event) {
        let current = ev.target as Element;

        // Check if clicked element is a node or any descendant of a node (in order to open object inspector if so)
        while (current != this.canvas.nativeElement) {
            if (this.hasClassSvgElement(current, "node")) {
                this.openNodeInInspector(current);
                break;
            }
            current = current.parentNode as Element;
        }
    }

    /**
     * Returns type of inspected node to determine which template to render for object inspector
     */
    private typeOfInspectedNode() {
        if (this.inspectedNode instanceof StepModel) {
            return "Step";
        } else if (this.inspectedNode instanceof WorkflowInputParameterModel) {
            return "Input";
        } else {
            return "Output";
        }
    }

    /**
     * Open node in object inspector
     */
    private openNodeInInspector(node: Element) {

        let typeOfNode = "steps";

        if (this.hasClassSvgElement(node, "input")) {
            typeOfNode = "inputs";
        } else if (this.hasClassSvgElement(node, "output")) {
            typeOfNode  ="outputs";
        }

        this.inspectedNode = this.model[typeOfNode].find((input) => input.id === node.getAttribute("data-id"));
        this.inspector.show(this.inspectorTemplate, this.inspectedNode.id);
    }

    /**
     * IE does not support classList property for old browsers and also SVG elements
     */
    private hasClassSvgElement(element: Element, className: string) {
        const elementClass = element.getAttribute("class") || "";
        return elementClass.split(" ").indexOf(className) > -1;
    }

    ngOnDestroy() {
        this.inspector.hide();
    }
}