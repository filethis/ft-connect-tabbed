/*
Copyright 2018 FileThis, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
/**
`<ft-connect-tabbed>`

An element that implements a FileThis user workflow as a set of tabbed panels. As the user progresses, they navigate to the next tab in the sequence.

@demo
*/
/*
  FIXME(polymer-modulizer): the above comments were extracted
  from HTML and may be out of place here. Review them and
  then delete this comment!
*/
import '@polymer/app-route/app-route.js';

import '@filethis/ft-confirmation-dialog/ft-confirmation-dialog.js';
import '@filethis/ft-connect-behavior/ft-connect-behavior.js';
import '@filethis/ft-connection-panel/ft-connection-panel.js';
import '@filethis/ft-document-panel/ft-document-panel.js';
import '@filethis/ft-source-panel/ft-source-panel.js';
import '@filethis/ft-user-interaction-form/ft-user-interaction-form.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/iron-pages/iron-pages.js';
import '@polymer/paper-checkbox/paper-checkbox.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-tabs/paper-tabs.js';
import '@polymer/paper-tabs/paper-tab.js';
import '@polymer/polymer/polymer-legacy.js';
import '@polymer/polymer/lib/elements/custom-style.js';
import '@webcomponents/shadycss/entrypoints/apply-shim.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
Polymer({
  _template: html`
        <style include="iron-flex iron-flex-alignment iron-positioning"></style>

        <style>
            :host {
                display: block;
                overflow: hidden;
                @apply --layout-vertical;
                @apply --ft-connect-tabbed;
            }
        </style>

        <custom-style>
            <style>
                /* We use links in our tab bar so that routing will work, but want the text to look "normal" */
                a {
                    color: black;
                    border: none;
                    text-decoration:none;
                    height: auto !important;
                }

                #panelTabs
                {
                    --paper-tabs-selection-bar-color:blue;
                }
            </style>
        </custom-style>

        <app-route route="{{route}}" pattern="/:panelName" data="{{_routeData}}">
        </app-route>

        <!-- Panel Tabs -->
        <div class="layout horizontal start">
            <paper-tabs id="panelTabs" attr-for-selected="name" selected="{{_selectedPanelName}}" style="font-size:16pt; ">
                <paper-tab name="sources"><a href="#/sources" tabindex="-1">Sites</a></paper-tab>
                <paper-tab name="connections"><a href="#/connections" tabindex="-1">Connections</a></paper-tab>
                <paper-tab name="documents"><a href="#/documents" tabindex="-1">Documents</a></paper-tab>
            </paper-tabs>
        </div>

        <!-- Panels -->
        <iron-pages id="panels" class="flex layout vertical" style="border-top:1px solid #DDD; " attr-for-selected="name" selected="{{_selectedPanelName}}">
            <!-- Source panel -->
            <ft-source-panel id="sourcesPanel" name="sources" class="flex" selected-filter-id="{{selectedFilterId}}" sources="[[sources]]" ft-source-panel-show-heading="false">
            </ft-source-panel>

            <!-- Connection panel -->
            <ft-connection-panel id="connectionsPanel" name="connections" class="flex" connections="[[connections]]" sources="[[sources]]" ft-connection-panel-show-heading="false">
            </ft-connection-panel>

            <!-- Document panel -->
            <ft-document-panel id="documentsPanel" name="documents" class="flex" documents="[[documents]]" ft-document-panel-show-heading="false" ft-document-panel-show-grid-button="true" ft-document-panel-show-list-button="true" ft-document-panel-show-preview-button="false" ft-document-panel-show-upload-button="false" ft-document-panel-show-download-button="false" ft-document-panel-show-delete-button="true" ft-document-panel-show-document-count="false">
            </ft-document-panel>

        </iron-pages>

        <!-- User interaction dialog -->
        <paper-dialog modal="" id="modalInteractionDialog" style="width:450px;
                      padding-left: 40px; padding-top: 12px; padding-right: 40px; padding-bottom: 5px;">

            <ft-user-interaction-form id="interactionForm" version="[[interactionVersion]]" request="[[_interactionRequest]]" response="{{_interactionResponse}}" on-submit-response-command="_onSubmitResponseCommand" on-button-clicked="_onInteractionFormButtonClicked" style="background:white; border: 1px solid #DDD;">
            </ft-user-interaction-form>

        </paper-dialog>

        <!-- Uploader -->
        <input id="uploader" hidden="" type="file" on-change="_onUploaderFilesChanged" multiple="true" accept="[[_uploadableFileTypes]]">

        <!-- Downloader -->
        <a id="downloader" hidden="" href\$="[[_downloadUrl]]" download\$="[[_downloadFilename]]">
        </a>

        <!-- Confirmation dialog -->
        <ft-confirmation-dialog id="confirmationDialog"></ft-confirmation-dialog>
`,

  is: 'ft-connect-tabbed',

  behaviors: [
      FileThis.ConnectBehavior,
      FileThis.ErrorBehavior,
      FileThis.HttpBehavior // TODO: Why do we have to include these when ConnectBehavior aready does?
  ],

  listeners:
  {
      'create-connection-command': '_onCreateConnectionCommand'
  },

  properties: {

      /** Route. */
      route: {
          type: Object,
          notify: true
      },

      _routeData: {
          type: Object,
          observer: "_onRouteDataChanged"
      },

      /** Name of the selected panel. One of: "sources", "connections", or "documents". */
      _selectedPanelName:
      {
          type: String,
          value: "sources",
          observer: "_onSelectedPanelNameChanged"
      }

  },

  // Application _routeData members ------------------------------------------------------------------

  ready: function()
  {
      this.async(function()
      {
          this._selectedPanelName = "sources";
      });
  },

  _onRouteDataChanged: function(to, from)
  {
      if (!this._routeData)
          return;
      if (!this._selectedPanelName)
          return;
      this._selectedPanelName = this._routeData.panelName;
  },

  _onSelectedPanelNameChanged: function(to, from)
  {
      if (!this._routeData)
          return;
      if (!this._selectedPanelName)
          return;
      this._routeData.panelName = this._selectedPanelName;
  },

  // User action event handling --------------------------------------------------------------------------

  _onInteractionFormButtonClicked: function(event)
  {
      var detail = event.detail;
      if (detail.action === "defer")
          this.$.modalInteractionDialog.close();
  },

  _onSubmitResponseCommand: function(event)
  {
      var interactionRequest = this._interactionRequest;
      var interactionResponse = this._interactionResponse;

      var connectionId = interactionRequest.connectionId;
      var interactionId = interactionRequest.id;
      var url = this.server + this.apiPath +
          "/accounts/" + this.account.id +
          "/connections/" + connectionId +
          "/interactions/" + interactionId +
          "/response";
      var options = this._buildHttpOptions();

      return this.httpPut(url, interactionResponse, options)
          .then(function()
          {
              this.$.modalInteractionDialog.close();
          }.bind(this))
          .catch(function(reason)
          {
              this._handleError(reason);
              this.$.modalInteractionDialog.close();
          }.bind(this));
  },

  //            _onSubmitInteractionResponseNew: function(event)
  //            {
  //                var interactionRequest = this._interactionRequest;
  //                var interactionResponse = this._interactionResponse;
  //
  //                var connectionId = interactionRequest.connectionId;
  //                var interactionId = interactionRequest.id;
  //                var url = this.server + this.apiPath +
  //                    "/accounts/" + this.account.id +
  //                    "/connections/" + connectionId +
  //                    "/interactions/" + interactionId +
  //                    "/response";
  //            var options = this._buildHttpOptions();
  //
  //                return this.httpPost(url, interactionResponse, options)
  //                    .then(function()
  //                    {
  //                        this.$.modalInteractionDialog.close();
  //                    }.bind(this))
  //                    .catch(function(reason)
  //                    {
  //                        this._handleError(reason);
  //                        this.$.modalInteractionDialog.close();
  //                    }.bind(this));
  //            },

  poseNextPendingInteractionRequest: function()
  {
      if (this._interactionRequests.length === 0)
          return;

      // If we already have a dialog posed
      if (this.$.modalInteractionDialog.opened)
          return;

      // Pose the first request
      var interactionRequest = this._interactionRequests[0];
      this._interactionRequest = interactionRequest;
      this.$.modalInteractionDialog.open();
      return interactionRequest;
  },

  _poseNextPendingInteractionRequest: function()
  {
      return this.poseNextPendingInteractionRequest();
  },

  _onCreateConnectionCommand: function(event)
  {
      this._selectedPanelName = "connections";  // TODO: Make this a configurable option?
  },

  pageCodeDropIn:
      "<!-- Put this at the top of your page -->\n" +
      "<link rel=\"import\" href=\"https://connect.filethis.com/ft-connect-tabbed/latest/dropin/ft-connect-tabbed.html\">\n" +
      "\n" +
      "<!-- Put this into the content of your page -->\n" +
      "{{SETTINGS}}\n" +
      "<{{NAME}}\n" +
      "    user-account-id=\"{{ACCOUNT_ID}}\"\n" +
      "    token=\"{{TOKEN}}\"\n" +
      "    live=\"true\"\n" +
      "    debug=\"true\"\n" +
      "    fake-sources=\"true\">\n" +
      "</{{NAME}}>\n",

  pageCodeCustom:
      "<!-- Put this at the top of your page -->\n" +
      "<link rel=\"import\" href=\"../bower_components/{{NAME}}/{{NAME}}.html\">\n" +
      "\n" +
      "<!-- Put this into the content of your page -->\n" +
      "{{SETTINGS}}\n" +
      "<{{NAME}}\n" +
      "    user-account-id=\"{{ACCOUNT_ID}}\"\n" +
      "    token=\"{{TOKEN}}\"\n" +
      "    live=\"true\"\n" +
      "    debug=\"true\"\n" +
      "    fake-sources=\"true\">\n" +
      "</{{NAME}}>\n",

  getPageCodeTemplate: function(isDropIn, hasStyling, hasSettingsImports, hasSettingsElements)
  {
      if (isDropIn)  // Drop-In
          return this.pageCodeDropIn;
      else // Custom
          return this.pageCodeCustom;
  }
});
