import styles from "./Application.module.css";
import Nav from "../components/application/layout/Nav";
import Steps from "../components/application/layout/Steps";
import StacksLogo from "../public/images/stacks-logo.svg";
import Checkmark from "../public/images/checkmark.svg";
import ProjectImpact from "../components/application/ProjectImpact";
import ProjectLinks from "../components/application/ProjectLinks";
import ApplicationType from "../components/application/ApplicationType";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  isValidURL,
  isValidEmail,
  isValidStxAddress,
} from "../components/Input";

import { authOptions } from "./api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth/next";
import ProjectInformation from "../components/application/ProjectInformation";
import ProjectUserInfoOne from "../components/application/ProjectUserInfoOne";
import ProjectUserInfoTwo from "../components/application/ProjectUserInfoTwo";
import ProjectFundingStream from "../components/application/ProjectFundingStream";
import ProjectTrack from "../components/application/ProjectTrack";
import ProjectTags from "../components/application/ProjectTags";
import ProjectRoadmap from "../components/application/ProjectRoadmap";
import ProjectMission from "../components/application/ProjectMission";
import ProjectUserInfoCTwo from "../components/application/ProjectUserInfoCTwo";
import ProjectRevisionsOne from "../components/application/ProjectRevisionsOne";
import ProjectRevisionsTwo from "../components/application/ProjectRevisionsTwo";
import { useSession } from "next-auth/react";
import { generateTemplate } from "../components/application/layout/markdownTemplates/IssueTemplate";
import { Octokit } from "@octokit/rest";

const Application = () => {
  const { data: session } = useSession();
  const [flow, setFlow] = useState();

  useEffect(() => {
    let formData = JSON.parse(localStorage.getItem("formData"));

    if (!formData) {
      localStorage.setItem("formData", JSON.stringify({}));
    }
    formData = JSON.parse(localStorage.getItem("formData"));
    formData.githubUsername = session.user.name;
    localStorage.setItem("formData", JSON.stringify(formData));
  }, []);

  async function submitApplication() {
    let formData = JSON.parse(localStorage.getItem("formData"));

    let markdown = generateTemplate(flow, formData);

    const github = new Octokit({
      auth: session.accessToken,
    });

    let req = await github.rest.issues.create({
      owner: "vidiabtc",
      repo: "sveltekit-cf-prisma-planetscale",
      title: formData.projectTitle,
      body: markdown,
      assignees: ["vidiabtc"],
      labels: ["new"],
    });

    let res = req.data;

    // send request, then if status 201 then clear localstorage
  }

  const [currentStep, setCurrentStep] = useState(1);

  let invalidFields = [];

  let optionGroupsChecked = [];
  let optionGroupsValid = [];

  function validateField(field) {
    field.style.outlineColor = "#3182ce";
    field.style.borderColor = "#3182ce";
    invalidFields = invalidFields.filter((e) => e !== field.name);
  }

  function checkField(field) {
    switch (field.type) {
      case "text":
      case "textarea":
        if (field.value == undefined || field.value == "") {
          field.style.outlineColor = "red";
          field.style.borderColor = "red";
          invalidFields.push(field.name);
          console.log("invalid so pushing");
        } else {
          switch (field.name) {
            case "wishlistGithub":
            case "referenceLink":
              console.log("CHECKING");
              if (!isValidURL(field.value)) {
                console.log("is valid url");
                field.style.outlineColor = "red";
                field.style.borderColor = "red";
                invalidFields.push(field.name);
              } else {
                console.log("is invalid url");

                validateField(field);
              }
              break;
            case "email":
              if (!isValidEmail(field.value)) {
                field.style.outlineColor = "red";
                field.style.borderColor = "red";
                invalidFields.push(field.name);
              } else {
                validateField(field);
              }
              break;
            case "stxAddress":
              if (!isValidStxAddress(field.value)) {
                field.style.outlineColor = "red";
                field.style.borderColor = "red";
                invalidFields.push(field.name);
              } else {
                validateField(field);
              }
              break;

            default:
              validateField(field);
              break;
          }
        }
        break;
      case "radio":
        if (!optionGroupsChecked.includes(field.name)) {
          optionGroupsChecked.push(field.name);
        }
        if (!optionGroupsValid.includes(field.name)) {
          if (field.checked) {
            optionGroupsValid.push(field.name);
            validateField(field);
          }
        }
        break;
    }
    console.log("invalid fields", invalidFields);
    console.log("valid fields", optionGroupsValid);
  }

  function handleSubmit(nextStepNumber) {
    let fields = Array.from(document.querySelectorAll("input, textarea"));

    fields.map((field) => {
      switch (field.name) {
        case "discordUsername":
        case "twitterUsername":
        case "projectTeam":
        case "referenceLink":
        case "referenceLinkDescription":
        case "budgetRevision":
        case "durationRevision":
        case "projectRevisions":
        case "githubUsername":
          break;
        case "wishlistGithub":
          let existingWishlist =
            document.getElementById("existingWishlist").checked;
          console.log("EXISTING WISHLIST? ", existingWishlist);
          if (existingWishlist) {
            checkField(field);
            break;
          } else {
            validateField(field);
          }
          break;

        case "stxMemo":
          let stxMemoNotRequired =
            document.getElementById("stxMemoRequired").checked;
          if (stxMemoNotRequired) {
            validateField(field);
            break;
          }
          checkField(field);
          break;
        case "previousGrant":
          let previouslyCompletedGrant = document.getElementById(
            "completedPreviousGrant"
          ).checked;
          if (!previouslyCompletedGrant) {
            validateField(field);
            break;
          }
          checkField(field);
          break;
        case "otherEcosystemPrograms":
          let otherEcosystemPrograms =
            document.getElementById("otherEcosystem").checked;
          if (!otherEcosystemPrograms) {
            validateField(field);
            break;
          }
          checkField(field);
          break;
        default:
          checkField(field);
          break;
      }
    });
    let optionsValid = optionGroupsChecked.length == optionGroupsValid.length;
    optionsValid ? null : invalidFields.push(optionGroupsChecked[0]);

    let formData = JSON.parse(localStorage.getItem("formData"));

    console.log("invalid fields", invalidFields);

    if (invalidFields.length == 0) {
      console.log("invalid fields length 0", invalidFields);

      setCurrentStep(nextStepNumber);
      fields.map((field) => {
        let { name, value, type } = field;

        switch (type) {
          case "text":
          case "textarea":
            formData[name] = value;
            break;
          case "radio":
            if (field.checked) {
              formData[name] = value;
            }
        }
        localStorage.setItem("formData", JSON.stringify(formData));
      });

      switch (formData.applicationType) {
        case "This is a direct application, I intend to perform the work myself or as part of a team.":
          setFlow("A");
          break;
        case "This is an application for a project I want to add to the Wishlist and hope someone else applied to complete it.":
          setFlow("B");
          break;
        case "This is an application I found on the Wishlist that I wish to complete. (paste issue url below)":
          setFlow("C");
          break;
      }
    }
  }

  const flowDefaultSteps = ["Application Type"];

  const FlowDefault = () => {
    switch (currentStep) {
      case 1:
        return <ApplicationType />;
    }
  };

  const flowASteps = [
    "Application Type",
    "User Information (1 of 2)",
    "User Information (2 of 2)",
    "Project Type",
    "Project Track",
    "Project Tags",
    "Project Information",
    "Project Roadmap",
    "Project Mission Statement",
    "Project Impact & Risks",
    "Project Links",
  ];

  const FlowA = () => {
    switch (currentStep) {
      case 1:
        return <ApplicationType />;
      case 2:
        return <ProjectUserInfoOne />;
      case 3:
        return <ProjectUserInfoTwo />;
      case 4:
        return <ProjectFundingStream />;
      case 5:
        return <ProjectTrack />;
      case 6:
        return <ProjectTags />;
      case 7:
        return <ProjectInformation />;
      case 8:
        return <ProjectRoadmap />;
      case 9:
        return <ProjectMission />;
      case 10:
        return <ProjectImpact />;
      case 11:
        return <ProjectLinks />;
    }
  };

  const flowBSteps = [
    "Application Type",
    "User Information",
    "Project Type",
    "Project Track",
    "Project Tags",
    "Project Information",
    "Project Roadmap",
    "Project Mission Statement",
    "Project Impact & Risks",
    "Project Links",
  ];

  const FlowB = () => {
    switch (currentStep) {
      case 1:
        return <ApplicationType />;
      case 2:
        return <ProjectUserInfoOne />;
      case 3:
        return <ProjectFundingStream />;
      case 4:
        return <ProjectTrack />;
      case 5:
        return <ProjectTags />;
      case 6:
        return <ProjectInformation />;
      case 7:
        return <ProjectRoadmap />;
      case 8:
        return <ProjectMission />;
      case 9:
        return <ProjectImpact />;
      case 10:
        return <ProjectLinks />;
    }
  };

  const flowCSteps = [
    "Application Type",
    "User Information (1 of 2)",
    "User Information (2 of 2)",
    "Project Revisions (1 of 2)",
    "Project Revisions (1 of 2)",
  ];

  const FlowC = () => {
    switch (currentStep) {
      case 1:
        return <ApplicationType />;
      case 2:
        return <ProjectUserInfoOne />;
      case 3:
        return <ProjectUserInfoCTwo />;
      case 4:
        return <ProjectRevisionsOne />;
      case 5:
        return <ProjectRevisionsTwo />;
    }
  };

  const navSteps = () => {
    switch (flow) {
      case "A":
        return flowASteps;
      case "B":
        return flowBSteps;
      case "C":
        return flowCSteps;
      default:
        return flowDefaultSteps;
    }
  };

  const CurrentStep = () => {
    switch (flow) {
      case "A":
        return <FlowA />;
      case "B":
        return <FlowB />;
      case "C":
        return <FlowC />;
      default:
        return <FlowDefault />;
    }
  };

  return (
    <div className={styles.applicationWrapper}>
      <Nav name={"Application"} step={currentStep} />
      <div className={styles.mainComponents}>
        <div id="step">
          <Steps
            handleSubmit={handleSubmit}
            step={currentStep}
            steps={navSteps()}
            setCurrentStep={setCurrentStep}
          />
        </div>
        <div className={styles.middleComponent}>
          <AnimatePresence exitBeforeEnter initial={false}>
            {CurrentStep()}
          </AnimatePresence>
        </div>
        <div className={styles.button}>
          {currentStep > 1 && currentStep == navSteps().length ? (
            <button onClick={submitApplication} name="okButton">
              <p>Submit Application</p>
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(currentStep + 1)}
              name="okButton"
            >
              <Checkmark />
              <p>Ok</p>
            </button>
          )}
        </div>
      </div>

      <StacksLogo className={styles.stacksSVG} />
    </div>
  );
};

export default Application;

export async function getServerSideProps(context) {
  const session = await unstable_getServerSession(
    context.req,
    context.res,
    authOptions
  );

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  session.user.email = "";
  return {
    props: {
      session,
    },
  };
}
