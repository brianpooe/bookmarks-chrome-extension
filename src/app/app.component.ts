/// <reference types="@types/chrome" />

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule],
  template: `
      <div class="container">
          <h1>{{ title }}</h1>
          <div class="bookmark">
              @for (item of bookmarks;track item.id) {
                  <div class="bookmark__item">
                      <span class="unique-identifier">{{ item.id }}.</span>
                      @if (!item.isEditable) {
                          <p>
                              <a [href]="item.url" target="_blank">{{ item.title }}</a>
                          </p>
                      } @else {
                          <p class="editor">
                              <input [(ngModel)]="editedItemTitle"
                                     [value]="item.title"
                                     type="text"
                                     name="edit" id="edit">
                              <button type="button" (click)="update(item)">update</button>
                          </p>
                      }
                      <svg
                              (click)="toggleEditor(item)"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                                  fill-rule="evenodd"
                                  clip-rule="evenodd"
                                  d="M21.2635 2.29289C20.873 1.90237 20.2398 1.90237 19.8493 2.29289L18.9769 3.16525C17.8618 2.63254 16.4857 2.82801 15.5621 3.75165L4.95549 14.3582L10.6123 20.0151L21.2189 9.4085C22.1426 8.48486 22.338 7.1088 21.8053 5.99367L22.6777 5.12132C23.0682 4.7308 23.0682 4.09763 22.6777 3.70711L21.2635 2.29289ZM16.9955 10.8035L10.6123 17.1867L7.78392 14.3582L14.1671 7.9751L16.9955 10.8035ZM18.8138 8.98525L19.8047 7.99429C20.1953 7.60376 20.1953 6.9706 19.8047 6.58007L18.3905 5.16586C18 4.77534 17.3668 4.77534 16.9763 5.16586L15.9853 6.15683L18.8138 8.98525Z"
                                  fill="currentColor"
                          />
                          <path
                                  d="M2 22.9502L4.12171 15.1717L9.77817 20.8289L2 22.9502Z"
                                  fill="currentColor"
                          />
                      </svg>
                      <svg
                              (click)="delete(item)"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                                  d="M8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H8Z"
                                  fill="currentColor"
                          />
                          <path
                                  fill-rule="evenodd"
                                  clip-rule="evenodd"
                                  d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                  fill="currentColor"
                          />
                      </svg>
                  </div>

              } @empty {
                  <p class="bookmark__item">There are no bookmarks.</p>
              }
          </div>
      </div>
  `,
  styles: [
    `
      .container {
        width: 45rem;
        margin: 2em;

        .bookmark {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          &__item {
            width: 100%;
            display: grid;
            grid-template-columns: 50px 1fr 50px 50px;
            align-items: center;

            svg {
              cursor: pointer;
            }

            h3 {
              padding-right: 1.5em;
            }

            .unique-identifier {
              padding: 0 1.5em;
            }

            .editor {
              padding: 0 1.5em;
            }
          }
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  title = 'Chrome bookmarks extension';
  bookmarks: BookmarkNode[] = [];
  editedItemTitle: string;

  ngOnInit(): void {
    (async () => {
      const tree: BookmarkTreeNode[] = await chrome.bookmarks?.getTree();
      this.bookmarks = this.extractAllChildren(tree);
    })();
  }

  extractAllChildren(data: BookmarkTreeNode[]): BookmarkNode[] {
    let extractedData: BookmarkNode[] = [];
    // Create a stack to keep track of nodes to be processed
    let stack: BookmarkTreeNode[][] = [data];

    // Process nodes until the stack is empty
    while (stack.length > 0) {
      // Get the next level of nodes from the stack
      const currentChildren: BookmarkTreeNode[] = stack.pop();

      // Process each child node
      for (const child of currentChildren) {
        // If the child node has a URL, add child to the extracted data
        if (child.url) {
          extractedData = [
            ...extractedData,
            {
              dateAdded: child.dateAdded,
              id: child.id,
              index: child.index,
              parentId: child.parentId,
              title: child.title,
              url: child.url,
              isEditable: false,
            },
          ];

          // If the child node has children, add them to the stack for processing
        } else if (child.children) {
          stack = [...stack, child.children];
        }
      }
    }

    return extractedData.sort(
      (a: BookmarkNode, b: BookmarkNode) => Number(a.id) - Number(b.id),
    );
  }

  async delete(item: BookmarkNode) {
    await chrome.bookmarks.remove(item.id);
    location.reload();
  }

  async update(item: BookmarkNode) {
    await chrome.bookmarks.update(item.id, {
      title: this.editedItemTitle,
    });
    location.reload();
  }

  toggleEditor(item: BookmarkNode) {
    this.bookmarks = this.bookmarks.map((bookmark) => {
      if (item.id === bookmark.id) {
        this.editedItemTitle = item.title;
        return { ...bookmark, isEditable: !item.isEditable };
      }

      return bookmark;
    });
  }
}

export interface BookmarkNode {
  dateAdded: number;
  id: string;
  index: number;
  parentId: string;
  title: string;
  isEditable: boolean;
  url?: string | null;
  dateLastUsed?: number | null;
}
